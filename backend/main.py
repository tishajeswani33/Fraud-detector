"""
Fraud Detection API — FastAPI Backend
Serves SMS/text fraud predictions via XGBoost + TF-IDF pipeline.
Auto-trains model on startup if not found.
"""

import os
import pickle
import logging
import time
import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("fraud-api")

# ─── Globals ────────────────────────────────────────────────────────────────

MODEL_DIR = Path(os.getenv("MODEL_DIR", "./models"))
_model = None
_tfidf = None


# ─── Lifespan ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _tfidf

    model_path = MODEL_DIR / "model.pkl"
    tfidf_path = MODEL_DIR / "tfidf.pkl"

    # Auto-train if model files are missing
    if not model_path.exists() or not tfidf_path.exists():
        logger.warning("Model files not found — auto-training now...")
        try:
            subprocess.run(
                [sys.executable, "train_sample.py"],
                check=True,
                timeout=120,
            )
            logger.info("Auto-training completed successfully.")
        except Exception as e:
            logger.error("Auto-training failed: %s", e)

    # Load models (gracefully handle missing files)
    try:
        with open(model_path, "rb") as f:
            _model = pickle.load(f)
        logger.info("model.pkl loaded — type: %s", type(_model).__name__)

        with open(tfidf_path, "rb") as f:
            _tfidf = pickle.load(f)
        logger.info("tfidf.pkl loaded — vocab: %d", len(_tfidf.vocabulary_))
    except FileNotFoundError as e:
        logger.error("Could not load model files: %s", e)
        logger.error("API will start but predictions will return 503.")
    except Exception as e:
        logger.error("Error loading models: %s", e)

    yield

    _model = None
    _tfidf = None


# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Fraud Detection API",
    description="Detects fraudulent / spam messages using XGBoost + TF-IDF.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The message text to classify.",
        examples=["Congratulations! You've won a free prize. Call now!"],
    )

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class PredictResponse(BaseModel):
    text: str
    label: str
    fraud_probability: float
    legitimate_probability: float
    confidence: float
    inference_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    tfidf_loaded: bool


# ─── Helpers ────────────────────────────────────────────────────────────────

def _predict(text: str) -> dict:
    if _model is None or _tfidf is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    t0 = time.perf_counter()
    features = _tfidf.transform([text])

    if hasattr(_model, "predict_proba"):
        proba = _model.predict_proba(features)[0]
        classes = list(_model.classes_)
        # handle both numeric [0,1] and string ["ham","spam"] labels
        fraud_idx = 1  # default: index 1 = positive/fraud
        if 1 in classes:
            fraud_idx = classes.index(1)
        elif "spam" in classes:
            fraud_idx = classes.index("spam")
        elif "fraud" in classes:
            fraud_idx = classes.index("fraud")

        fraud_prob = float(proba[fraud_idx])
        legit_prob = float(proba[1 - fraud_idx])
    else:
        score = float(_model.decision_function(features)[0])
        fraud_prob = float(1 / (1 + np.exp(-score)))
        legit_prob = 1.0 - fraud_prob

    elapsed_ms = (time.perf_counter() - t0) * 1000
    label = "fraud" if fraud_prob >= 0.5 else "legitimate"

    return {
        "label": label,
        "fraud_probability": round(fraud_prob, 6),
        "legitimate_probability": round(legit_prob, 6),
        "confidence": round(max(fraud_prob, legit_prob), 6),
        "inference_ms": round(elapsed_ms, 2),
    }


# ─── Routes ─────────────────────────────────────────────────────────────────

@app.get("/", tags=["root"])
async def root():
    return {"message": "Fraud Detection API is running. Visit /docs."}


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "tfidf_loaded": _tfidf is not None,
    }


@app.post("/predict", response_model=PredictResponse, tags=["prediction"])
async def predict(body: PredictRequest, request: Request):
    logger.info(
        "predict | ip=%s | text_len=%d",
        request.client.host,
        len(body.text),
    )
    try:
        result = _predict(body.text)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail="Inference failed.") from exc

    return PredictResponse(text=body.text, **result)


@app.post("/predict/batch", response_model=list[PredictResponse], tags=["prediction"])
async def predict_batch(bodies: list[PredictRequest]):
    """Classify up to 50 messages at once."""
    if len(bodies) > 50:
        raise HTTPException(status_code=400, detail="Max 50 messages per batch.")
    results = []
    for body in bodies:
        r = _predict(body.text)
        results.append(PredictResponse(text=body.text, **r))
    return results
