"""
Fraud Detection API — FastAPI Backend v3.0
==========================================
Multi-feature ensemble: XGBoost + Logistic Regression + Handcrafted features
Supports SMS, URLs, emails, social engineering, Hinglish messages.
Auto-trains on startup if model not found.
"""

import os
import re
import pickle
import logging
import time
import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from scipy.sparse import hstack, csr_matrix
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from database import init_db, log_prediction_to_db, get_stats, _db_mode

# ─── Logging ────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("fraud-api")

# ─── Globals ────────────────────────────────────────────────────

MODEL_DIR = Path(os.getenv("MODEL_DIR", "./models"))

_bundle   = None   # full ensemble bundle
_model    = None   # XGB (fallback)
_tfidf    = None   # word TF-IDF (fallback)

# ─── Regex Patterns for Signal Detection ────────────────────────

URL_RE           = re.compile(r"https?://\S+|www\.\S+", re.I)
IP_RE            = re.compile(r"\b\d{1,3}(\.\d{1,3}){3}\b")
MONEY_RE         = re.compile(r"[\$£₹€]\s?\d+|(?:rs\.?|rupees|dollars?)\s?\d+|\d+\s?(?:rs\.?|rupees|dollars?)", re.I)
URGENT_RE        = re.compile(r"urgent|asap|immediately|act now|limited time|expire|last chance|final notice|warning", re.I)
PRIZE_RE         = re.compile(r"winner|prize|lottery|reward|congrat|won|selected|free|gift", re.I)
OTP_RE           = re.compile(r"\botp\b|\bpin\b|share.*code|don.t share", re.I)
SUSPICIOUS_TLDS  = re.compile(r"\.(xyz|tk|ml|ga|cf|gq|click|link|online|site|top|pw|cc|work)\b", re.I)
PHISHING_KW      = re.compile(
    r"verify|kyc|suspend|blocked|compromised|hack|illegal|arrest|warrant|"
    r"irs|tax|refund|inheritance|prince|nigerian|bitcoin|crypto|wallet|"
    r"claim|redeem|activate|confirm|security.alert|account.suspended", re.I
)
HINGLISH_FRAUD   = re.compile(r"lottery|jeetne|jaldi|turant|kyc|block|kat\s?jaega|claim\s?karo|rupaye", re.I)
SOCIAL_ENG       = re.compile(r"stranded|western union|moneygram|soldier|transfer.*million|help.*money|need.*money|send.*money|emergency", re.I)

SIGNAL_PATTERNS = [
    (PRIZE_RE,         "Prize / Lottery Language"),
    (URGENT_RE,        "Urgency Cues"),
    (re.compile(r"click|call|txt|text back|dial|reply", re.I), "Action Commands"),
    (MONEY_RE,         "Monetary Bait"),
    (re.compile(r"congratulations|selected|chosen|eligible|won|reward", re.I), "False Validation"),
    (URL_RE,           "Contains Link"),
    (re.compile(r"verify|update|secure|account|login|identify|kyc|block", re.I), "Phishing Bait"),
    (re.compile(r"-(update|secure|verify|login|auth|account|billing)\.", re.I), "Suspicious Domain Pattern"),
    (SUSPICIOUS_TLDS,  "Suspicious TLD (.xyz .tk etc)"),
    (HINGLISH_FRAUD,   "Hinglish Fraud Cues"),
    (SOCIAL_ENG,       "Social Engineering Pattern"),
    (OTP_RE,           "OTP / Credential Phish"),
    (IP_RE,            "Raw IP Address URL"),
    (re.compile(r"bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly", re.I), "URL Shortener"),
    (re.compile(r"arrest|warrant|police|court|legal action|penalty|jail", re.I), "Fear Tactics"),
    # New patterns
    (re.compile(r"customer service|support team|help desk|agent", re.I), "Impersonation Attempt"),
    (re.compile(r"limited time|expires in|act now|hurry", re.I), "Artificial Scarcity/Urgency"),
    (re.compile(r"bitcoing|crypto|wallet|blockchain|ethereum", re.I), "Crypto Scam Bait"),
    (re.compile(r"gift card|voucher|cashback|refund", re.I), "Financial Bait"),
]

# ─── Handcrafted Feature Extractor (matches training) ───────────

from sklearn.base import BaseEstimator, TransformerMixin
import __main__

class HandcraftedFeatures(BaseEstimator, TransformerMixin):
    """Extracts numerical heuristic features from raw text."""

    URL_RE    = re.compile(r"https?://\S+|www\.\S+", re.I)
    IP_RE     = re.compile(r"\b\d{1,3}(\.\d{1,3}){3}\b")
    MONEY_RE  = re.compile(r"[\$£₹€]\s?\d+|(?:rs\.?|rupees|dollars?)\s?\d+|\d+\s?(?:rs\.?|rupees|dollars?)", re.I)
    URGENT_RE = re.compile(r"urgent|asap|immediately|act now|limited time|expire|last chance|final notice|warning|hurry", re.I)
    PRIZE_RE  = re.compile(r"winner|prize|lottery|reward|congrat|won|selected|free|gift", re.I)
    OTP_RE    = re.compile(r"\botp\b|\bpin\b|\bpassword\b|share.*code|don.t share", re.I)
    SUSPICIOUS_TLDS = re.compile(r"\.(xyz|tk|ml|ga|cf|gq|click|link|online|site|top|pw|cc|work)\b", re.I)
    
    _SUSPICIOUS_KEYWORDS = re.compile(
        r"verify|kyc|suspend|blocked|compromised|hack|illegal|arrest|"
        r"warrant|irs|tax|refund|inheritance|prince|nigerian|soldier|"
        r"stranded|western union|moneygram|bitcoin|crypto|wallet|"
        r"claim|redeem|activate|confirm|limited|urgent|asap", re.I
    )

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        feats = []
        for text in X:
            t = str(text)
            urls    = self.URL_RE.findall(t)
            n_urls  = len(urls)
            has_ip  = int(bool(self.IP_RE.search(t)))
            n_money = len(self.MONEY_RE.findall(t))
            has_urgent = int(bool(self.URGENT_RE.search(t)))
            has_prize  = int(bool(self.PRIZE_RE.search(t)))
            has_otp    = int(bool(self.OTP_RE.search(t)))
            n_suspicious_kw = len(self._SUSPICIOUS_KEYWORDS.findall(t))
            has_bad_tld     = int(bool(self.SUSPICIOUS_TLDS.search(t)))

            # URL-specific
            url_len    = len(urls[0]) if urls else 0
            n_subdomains = (urls[0].count(".") - 1) if urls else 0
            has_http_not_s = int(any(u.startswith("http://") for u in urls))
            
            # New URL features
            n_special_url = sum(1 for c in (urls[0] if urls else "") if c in "@-#_?=")
            has_port      = int(":" in (urls[0].split("//")[-1] if urls else ""))

            # Text features
            n_caps      = sum(1 for c in t if c.isupper())
            text_len    = len(t)
            caps_ratio  = n_caps / max(text_len, 1)
            n_exclaim   = t.count("!")
            n_question  = t.count("?")
            n_digits    = sum(1 for c in t if c.isdigit())
            digits_ratio = n_digits / max(text_len, 1)

            feats.append([
                n_urls, has_ip, n_money, has_urgent, has_prize, has_otp,
                n_suspicious_kw, has_bad_tld, url_len, n_subdomains,
                has_http_not_s, caps_ratio, n_exclaim, n_question, text_len,
                n_special_url, has_port, digits_ratio
            ])
        return csr_matrix(np.array(feats, dtype=np.float32))

__main__.HandcraftedFeatures = HandcraftedFeatures

def _extract_handcrafted(text: str) -> csr_matrix:
    hf = HandcraftedFeatures()
    return hf.transform([text])

# ─── Lifespan ───────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bundle, _model, _tfidf

    init_db()

    bundle_path = MODEL_DIR / "bundle.pkl"
    model_path  = MODEL_DIR / "model.pkl"
    tfidf_path  = MODEL_DIR / "tfidf.pkl"

    if not bundle_path.exists() and not model_path.exists():
        logger.warning("No model files found — auto-training now (this may take ~2 min)…")
        try:
            subprocess.run([sys.executable, "train_sample.py"], check=True, timeout=300)
            logger.info("Auto-training complete.")
        except Exception as e:
            logger.error("Auto-training failed: %s", e)

    # Try to load full bundle first
    if bundle_path.exists():
        try:
            with open(bundle_path, "rb") as f:
                _bundle = pickle.load(f)
            logger.info(
                "Bundle v%s loaded — XGB + LR ensemble ready.",
                _bundle.get("version", "?"),
            )
        except Exception as e:
            logger.error("Failed to load bundle: %s", e)

    # Fallback: legacy single-model
    if _bundle is None:
        try:
            with open(model_path, "rb") as f:
                _model = pickle.load(f)
            with open(tfidf_path, "rb") as f:
                _tfidf = pickle.load(f)
            logger.info("Legacy model loaded (no bundle).")
        except FileNotFoundError as e:
            logger.error("No models found: %s — predictions will return 503.", e)
        except Exception as e:
            logger.error("Error loading legacy model: %s", e)

    yield

    _bundle = _model = _tfidf = None


# ─── App ────────────────────────────────────────────────────────

app = FastAPI(
    title="FraudShield API v3.0",
    description="Ensemble fraud detection: XGBoost + LR + Handcrafted features.",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Schemas ─────────────────────────────────

class PredictRequest(BaseModel):
    text: str = Field(
        ..., min_length=1, max_length=5000,
        description="Message, URL, or email text to classify.",
        examples=["Congratulations! You've won a free prize. Call now!"],
    )

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class SignalDetail(BaseModel):
    label: str
    matched: bool


class PredictResponse(BaseModel):
    text: str
    label: str
    fraud_probability: float
    legitimate_probability: float
    confidence: float
    inference_ms: float
    risk_level: str
    signals: list[str]
    extracted_urls: list[str] = []
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    tfidf_loaded: bool
    bundle_loaded: bool
    model_version: Optional[str]


# ─── Prediction Core ────────────────────────────────────────────

def _detect_signals(text: str) -> list[str]:
    return [label for pat, label in SIGNAL_PATTERNS if pat.search(text)]


def _predict(text: str) -> dict:
    t0 = time.perf_counter()

    if _bundle is not None:
        tfidf_word = _bundle["tfidf_word"]
        tfidf_char = _bundle["tfidf_char"]
        xgb        = _bundle["xgb"]
        lr         = _bundle["lr"]

        Xw = tfidf_word.transform([text])
        Xc = tfidf_char.transform([text])
        Xh = _extract_handcrafted(text)
        X  = hstack([Xw, Xc, Xh])

        p_xgb = xgb.predict_proba(X)[0]
        p_lr  = lr.predict_proba(X)[0]

        classes = list(xgb.classes_)
        fi = 1
        if 1 in classes:
            fi = classes.index(1)

        fraud_prob = float(0.7 * p_xgb[fi] + 0.3 * p_lr[fi])
        
        # Heuristic boost for accurate boundary cases
        signals_detected = _detect_signals(text)
        if signals_detected:
            # Dynamic boost based on signals, allowing the model to override false negatives
            boost = len(signals_detected) * 0.12
            if fraud_prob > 0.05: # only boost if it's not absolutely unmistakably zero 
                fraud_prob = min(0.99, fraud_prob + boost)
            elif len(signals_detected) >= 2:
                # strongly suspicious even if base model says very low
                fraud_prob = min(0.99, fraud_prob + boost)
        
        legit_prob = 1.0 - fraud_prob
        version    = _bundle.get("version", "3.0")

    elif _model is not None and _tfidf is not None:
        # Legacy fallback
        features = _tfidf.transform([text])
        if hasattr(_model, "predict_proba"):
            proba = _model.predict_proba(features)[0]
            classes = list(_model.classes_)
            fi = 1
            if 1 in classes:    fi = classes.index(1)
            elif "spam" in classes: fi = classes.index("spam")
            fraud_prob = float(proba[fi])
        else:
            score = float(_model.decision_function(features)[0])
            fraud_prob = float(1 / (1 + np.exp(-score)))
        legit_prob = 1.0 - fraud_prob
        version    = "1.0-legacy"
    else:
        raise HTTPException(status_code=503, detail="Models not loaded yet. Try again shortly.")

    elapsed_ms = (time.perf_counter() - t0) * 1000
    label = "fraud" if fraud_prob >= 0.5 else "legitimate"

    pct = fraud_prob * 100
    risk_level = (
        "CRITICAL" if pct > 90 else
        "HIGH"     if pct > 70 else
        "MEDIUM"   if pct > 50 else
        "LOW"      if pct > 25 else
        "SAFE"
    )

    return {
        "label":                label,
        "fraud_probability":    round(fraud_prob, 6),
        "legitimate_probability": round(legit_prob, 6),
        "confidence":           round(max(fraud_prob, legit_prob), 6),
        "inference_ms":         round(elapsed_ms, 2),
        "risk_level":           risk_level,
        "signals":              _detect_signals(text),
        "extracted_urls":       URL_RE.findall(text),
        "model_version":        version,
    }


# ─── Routes ─────────────────────────────────────────────────────

@app.get("/api/", tags=["root"])
async def root():
    return {
        "message": "FraudShield API v3.0 — Ensemble Fraud Detection is running.",
        "database": _db_mode,
        "docs": "/docs",
    }


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None or _bundle is not None,
        "tfidf_loaded": _tfidf is not None or _bundle is not None,
        "bundle_loaded": _bundle is not None,
        "model_version": _bundle.get("version") if _bundle else ("1.0-legacy" if _model else None),
    }


@app.post("/api/predict", response_model=PredictResponse, tags=["prediction"])
async def predict(body: PredictRequest, request: Request, background_tasks: BackgroundTasks):
    logger.info("predict | ip=%s | len=%d", request.client.host, len(body.text))
    try:
        result = _predict(body.text)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail="Inference failed.") from exc

    background_tasks.add_task(log_prediction_to_db, result, body.text)
    return PredictResponse(text=body.text, **result)


@app.get("/api/analytics", tags=["analytics"])
async def analytics_stats():
    """Get high-level statistics from the database for the analytics dashboard."""
    stats = get_stats()
    if stats is None:
        # Return fallback/placeholder data if database connection is not active
        return {
            "total_scans": 1284,
            "fraud_detected": 42,
            "avg_inference_ms": 12.4,
            "risk_distribution": {"CRITICAL": 5, "HIGH": 12, "MEDIUM": 25, "LOW": 30, "SAFE": 56},
            "status": "placeholder - database disconnected"
        }
    return stats


@app.post("/api/predict/batch", response_model=list[PredictResponse], tags=["prediction"])
async def predict_batch(bodies: list[PredictRequest], background_tasks: BackgroundTasks):
    """Classify up to 100 messages at once."""
    if len(bodies) > 100:
        raise HTTPException(status_code=400, detail="Max 100 messages per batch.")
    results = []
    for body in bodies:
        r = _predict(body.text)
        background_tasks.add_task(log_prediction_to_db, r, body.text)
        results.append(PredictResponse(text=body.text, **r))
    return results

# ─── Static Frontend Serving ────────────────────────────────────

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{catchall:path}", include_in_schema=False)
    async def serve_frontend(catchall: str):
        if catchall.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        file_path = FRONTEND_DIST / catchall
        if file_path.is_file():
            return FileResponse(file_path)
            
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
            
        return {"detail": "Frontend build not found"}
else:
    @app.get("/", include_in_schema=False)
    async def fallback_root():
        return RedirectResponse(url="/docs")
