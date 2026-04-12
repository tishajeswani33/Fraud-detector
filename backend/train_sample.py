"""
train_sample.py — Advanced Multi-Category Fraud Detection Model
================================================================
Trains an ensemble (XGBoost + Logistic Regression voting classifier)
using 60,000+ synthetic samples across:
  - SMS phishing / spam
  - Phishing URLs (English & Hinglish)
  - Email-style scams
  - Social engineering messages
  - Banking & OTP fraud
  - Legitimate messages across all categories
"""

import pickle
import random
import re
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import FeatureUnion
from sklearn.base import BaseEstimator, TransformerMixin
from xgboost import XGBClassifier
from sklearn.ensemble import VotingClassifier
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack, csr_matrix

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

random.seed(42)
np.random.seed(42)

print("=" * 65)
print("  Advanced Fraud Detection Model — Training Pipeline v3.0")
print("=" * 65)

# ─── Domain & Brand Lists ────────────────────────────────────────

PHISHING_BRANDS = [
    "paypal", "apple", "netflix", "bankofamerica", "chase", "amazon",
    "fedex", "sbi", "hdfc", "icici", "microsoft", "google", "facebook",
    "instagram", "whatsapp", "twitter", "linkedin", "wellsfargo",
    "citibank", "barclays", "hsbc", "boa", "usbank", "truist",
    "coinbase", "binance", "upi", "paytm", "phonepe", "gpay",
    "zepto", "zomato", "swiggy", "flipkart", "myntra", "airtel",
    "jio", "vodafone", "postoffice", "irs", "income-tax", "epfo",
    "uidai", "nsdl", "ebay", "walmart", "target", "bestbuy",
]
PHISHING_DOMAINS_BASE = [
    "secure-update", "verify-acc", "billing-update", "reward-claim",
    "auth-portal", "login-secure", "account-verify", "security-alert",
    "suspended-acc", "confirm-payment", "claim-prize", "reset-now",
    "support-center", "help-desk", "fraud-alert", "kyc-update",
    "otp-verify", "refund-now", "recharge-free", "win-prize",
]
DOMAIN_TLDS = [
    ".com", ".net", ".org", ".info", ".xyz", ".co.uk", ".in",
    ".site", ".online", ".top", ".club", ".pw", ".cc", ".tk",
    ".ml", ".ga", ".cf", ".gq", ".work", ".click", ".link",
]
PHISHING_PATHS = [
    "/login", "/auth", "/verify", "/update", "/secure", "/claim",
    "/reset", "/billing", "/confirm", "/validate", "/signin",
    "/account", "/payment", "/kyc", "/otp", "/recharge",
]
LEGIT_DOMAINS = [
    "google", "github", "stackoverflow", "wikipedia", "react",
    "paypal", "amazon", "netflix", "apple", "microsoft", "yahoo",
    "bbc", "cnn", "nytimes", "forbes", "medium", "dev.to",
    "npmjs", "python.org", "docs.python", "mozilla.org", "w3.org",
]
LEGIT_TLDS = [".com", ".org", ".net", ".edu", ".gov", ".io"]

# ─── URL Generators ──────────────────────────────────────────────

def gen_phishing_urls(n):
    urls = []
    for _ in range(n):
        brand = random.choice(PHISHING_BRANDS)
        base  = random.choice(PHISHING_DOMAINS_BASE)
        tld   = random.choice(DOMAIN_TLDS)
        path  = random.choice(PHISHING_PATHS)
        uid   = random.randint(1000, 99999)
        structure = random.choice([
            f"http://{brand}-{base}{tld}{path}",
            f"https://{base}-{brand}{tld}{path}?id={uid}",
            f"http://www.{brand}-security-check{tld}{path}",
            f"https://{brand}.{base}{tld}",
            f"http://login.{brand}{tld}{path}?token={uid}",
            f"https://recover-{brand}-account{tld}/",
            f"http://{base}{tld}/{brand}/{path}",
            f"https://{uid}.{brand}-support{tld}{path}",
            f"http://{brand}{uid}{tld}{path}",
            f"https://free-{brand}-reward{tld}/claim?ref={uid}",
            f"http://bit.ly/{uid}",
            f"https://tinyurl.com/{uid}{brand}",
            f"http://{random.randint(10,250)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}{path}",
        ])
        urls.append(structure)
    return urls

def gen_legit_urls(n):
    urls = []
    for _ in range(n):
        brand = random.choice(LEGIT_DOMAINS)
        tld   = random.choice(LEGIT_TLDS)
        path  = random.choice(["", "/index.html", "/about", "/docs", "/search?q=python", "/articles/1234"])
        url   = f"https://www.{brand}{tld}{path}"
        urls.append(url)
    return urls

# ─── SMS / Message Templates ─────────────────────────────────────

FRAUD_SMS = [
    "URGENT: Your {brand} account has been compromised. Verify now: {link}",
    "Action required: We detected unusual sign-in activity. Click: {link}",
    "Congratulations! You won a ${amount} gift card. Claim at {link}",
    "Your recent {brand} payment of ${amount} was declined. Update billing: {link}",
    "We could not deliver your package. Reschedule here: {link}",
    "Dear User, your password expires in 24 hours. Reset: {link}",
    "Limited time offer: FREE iPhone 16 Pro. Visit {link} to claim.",
    "{brand} FREE Offer: Tap to redeem your exclusive reward. Expires soon: {link}",
    "Security Alert! Someone tried logging into your {brand} account. Verify: {link}",
    "Your {brand} subscription will be cancelled today. Keep it active: {link}",
    "You have unclaimed cashback of ${amount}. Claim before midnight: {link}",
    "NOTICE: Your {brand} account is on hold. Confirm identity here: {link}",
    "OTP for your {brand} transaction: 847291. Do not share. If not you, report: {link}",
    "Congratulations! Your {brand} reward points expire today. Redeem: {link}",
    "Police alert: A warrant has been issued under your name. Call 1800-XXX-XXXX to avoid arrest.",
    "Your income tax refund of ${amount} has been processed. Click to receive: {link}",
    "Dear customer, your loan EMI of ${amount} is overdue. Pay now to avoid penalty: {link}",
    "Hi, I'm {brand} agent. Your account shows suspicious activity. Verify via: {link}",
    "You've been selected for a government grant of ${amount}. Apply here: {link}",
    "FINAL WARNING: {brand} account suspended. Resume access: {link}",
    "Earn ${amount}/day from home. No experience needed! {link}",
    "Your Amazon order #{amount} has a problem. Fix it here or it'll be cancelled: {link}",
    "Win a free cruise! You've been chosen. Claim your ticket: {link}",
    "Alert: ${amount} deducted from your account. If not you, click here: {link}",
    "Trouble with your delivery? Redeliver now for just $1.99: {link}",
]

FRAUD_HINGLISH_SMS = [
    "Bhai {amount} ki lottery lagi hai tumhari. {link} par jake claim karo jaldi.",
    "Aapka {brand} account suspend ho sakta hai. KYC update karein: {link}",
    "Free mobile recharge ke liye is link par click karein: {link}",
    "Aapka {amount} ka cashback pending hai. Abhi claim karein: {link}",
    "Aapke account mein {amount} deposit hoga. Link pe click karein: {link}",
    "Congratulations! Aapne {brand} ka bumper prize jeeta hai. Claim: {link}",
    "{brand} ki taraf se: Aapki KYC expire ho rahi hai. Update karein: {link}",
    "Aapka Aadhaar block hone wala hai. Abhi verify karein: {link}",
    "Sarkari yojana mein aapka naam select hua hai. Form bharen: {link}",
    "Aapka PAN card suspend ho raha hai. Abhi validate karein: {link}",
    "Income tax refund of Rs.{amount} aapke account mein aayega. Click: {link}",
    "Aapne UPI fraud report nahi ki toh Rs.{amount} kat jayenge. Block karein: {link}",
    "Ek baar sirf password bata do, {brand} account verify ho jayega.",
    "Sir, main {brand} customer care se bol raha hoon. OTP share karein.",
    "Yeh last chance hai. Rs.{amount} ka prize claim karein: {link}",
]

FRAUD_EMAIL_STYLE = [
    "Dear valued customer, your {brand} account has been flagged for suspicious activity...",
    "Attention: Your recent transaction could not be verified. Immediate action required.",
    "You have received a payment of ${amount}. Click here to accept: {link}",
    "This is an automated alert from {brand}. Your login was denied. Secure account: {link}",
    "We are writing to inform you that your {brand} account will be closed...",
    "Your {brand} invoice #{amount} is overdue. Pay now to avoid service interruption: {link}",
    "ALERT: New device logged in to your {brand}. Not you? Click: {link}",
    "Legal Notice from IRS: You owe ${amount} in back taxes. Pay immediately.",
    "Your inheritance of ${amount},000 is waiting. Contact us to claim: {link}",
    "Congratulations, you have been hired! Fill out this form to proceed: {link}",
]

FRAUD_SOCIAL_ENGINEERING = [
    "Hey! I'm stranded abroad and need ${amount} urgently. Please send via Western Union.",
    "Mom, it's me. I lost my phone. Can you send ${amount} to this number?",
    "I'm a Nigerian prince. I need your help transferring ${amount} million. You'll get 30%.",
    "Hello dear, I found your profile. You look beautiful. Let's be friends first...",
    "I'm a US soldier stationed overseas. I need a loyal partner to receive funds.",
    "Investment opportunity: ${amount}% return guaranteed in 7 days. Limited spots!",
    "Romance scam: My feelings for you are real. I just need ${amount} for the flight ticket.",
    "Tech support: Your computer has a virus. Call this toll-free number immediately.",
    "You won the Microsoft lottery! Pay ${amount} processing fee to claim your ${amount} prize.",
    "Urgent: Your SSN has been suspended. Call this number or you'll be arrested.",
]

LEGIT_SMS = [
    "Hey, are we still meeting tomorrow at {time}?",
    "Can you please send me the presentation slides for the meeting?",
    "Dinner is ready! Come downstairs before it gets cold.",
    "Happy Birthday! Hope you have an amazing day ahead. 🎂",
    "Thanks so much for your help today. Really appreciate it!",
    "Did you catch the last episode of that show? Mind blown!",
    "I'll be there in {time} minutes. Stuck in traffic, sorry!",
    "The meeting has been pushed to 3 PM. See you then.",
    "Can you grab some milk from the store on your way back?",
    "Your {brand} order has been shipped and will arrive by Thursday.",
    "Your OTP for logging in is 482710. It expires in 10 minutes.",
    "Hey, your job application to {brand} has been received. We'll be in touch!",
    "Your appointment with Dr. Smith is confirmed for tomorrow at 2:30 PM.",
    "Monthly statement for your {brand} account is now ready. View in the app.",
    "Your password was successfully changed. If this wasn't you, contact support.",
    "Reminder: Your subscription renews in 3 days. Manage it in settings.",
    "Your {brand} delivery was left at the front door. Have a great day!",
    "Hi! This is to confirm your interview slot on Friday at 11 AM.",
    "Your refund of ${amount} has been processed. It may take 3-5 business days.",
    "Good morning! Your daily workout reminder. Let's crush it today! 💪",
    "Update available for your {brand} app. Update now for the latest features.",
    "Your 2FA code is 918273. This code expires in 5 minutes.",
]

LEGIT_HINGLISH_SMS = [
    "Bhai kaha hai tu? Kaha milna hai aaj?",
    "PPT ready hai, mail kar diya. Check kar lena.",
    "Kal subah discuss karte hain in details mein.",
    "Bhai movie dekhne chalein aaj raat? Bahut dino baad milenge.",
    "Aaj khaana order karte hain kya? Pizza ya Chinese?",
    "Mera phone low battery pe hai, ghar aa raha hoon.",
    "Arey bhai, {brand} ne naya offer nikala hai, dekh lena app mein.",
    "Chal yaar, cricket match dekhte hain aaj. India vs England hai.",
    "Meeting postponed ho gayi. Kal hogi 4 baje.",
    "Happy Diwali! Khush raho, mazze karo. 🎆",
    "Bhai exam ki preparation kaisi chal rahi hai?",
    "Aaj gym nahi jayenge? Thak gayi thi kal se.",
]

LEGIT_EMAIL_STYLE = [
    "Hi {name}, I wanted to follow up on our conversation last week.",
    "Please find attached the quarterly report for your review.",
    "Thank you for attending our webinar. Here's the recording: {link}",
    "Your invoice has been paid successfully. Receipt is attached.",
    "Team meeting scheduled for Monday at 10 AM. Please confirm attendance.",
    "Welcome to our newsletter! Unsubscribe any time at the bottom.",
    "Your GitHub pull request has been approved and merged.",
    "Project deadline extended to next Friday. Update your tasks accordingly.",
    "We'd love your feedback on our service. It takes just 2 minutes.",
    "Your cloud backup completed successfully. {amount}GB used.",
]

# ─── Generation Helpers ──────────────────────────────────────────

def _fill(template, brand=None, amount=None, link=None, time=None, name=None):
    brand  = brand  or random.choice(PHISHING_BRANDS).title()
    amount = amount or random.choice([100, 250, 500, 1000, 2500, 5000, 10000, 25000])
    link   = link   or random.choice(gen_phishing_urls(1))
    time   = time   or random.choice([5, 10, 15, 20, 30, 45, 60])
    name   = name   or random.choice(["Rahul", "Priya", "John", "Sarah", "Amit", "Emily"])
    try:
        return template.format(brand=brand, amount=amount, link=link, time=time, name=name)
    except KeyError:
        return template

def _fill_legit(template):
    brand  = random.choice(LEGIT_DOMAINS).title()
    amount = random.choice([5, 10, 15, 30, 50, 100, 200])
    link   = random.choice(gen_legit_urls(1))
    time   = random.choice([5, 10, 15, 20, 30, 45, 60])
    name   = random.choice(["Rahul", "Priya", "John", "Sarah", "Amit", "Emily"])
    try:
        return template.format(brand=brand, amount=amount, link=link, time=time, name=name)
    except KeyError:
        return template

def gen_fraud_texts(n):
    pool = FRAUD_SMS + FRAUD_HINGLISH_SMS + FRAUD_EMAIL_STYLE + FRAUD_SOCIAL_ENGINEERING
    return [_fill(random.choice(pool)) for _ in range(n)]

def gen_legit_texts(n):
    pool = LEGIT_SMS + LEGIT_HINGLISH_SMS + LEGIT_EMAIL_STYLE
    return [_fill_legit(random.choice(pool)) for _ in range(n)]

# ─── Hand-crafted edge case samples ──────────────────────────────

EDGE_FRAUD = [
    "Mom, I had an accident. Please send $500 to this number right away.",
    "PRIZE ALERT: You have won $10,000. Call 1-800-CLAIM to receive.",
    "Your Netflix subscription is ending. Update payment: http://ntflx-billing.xyz/pay",
    "Verify your UPI account to avoid block. Share OTP NOW.",
    "FREE government money for eligible families. Apply: http://govt-scheme.tk/apply",
    "Dear Customer, your credit card has been temporarily blocked. Unblock: http://bank-secure-verify.xyz",
    "IMPORTANT: IRS Final Notice. You owe $3,200. Pay within 24hrs or face arrest.",
    "You're pre-approved for a $50,000 loan with no credit check. Apply: http://fastloan-now.site",
    "CONGRATULATIONS! Selected for our VIP reward! Confirm details here: http://vip-claim.online",
    "Your account login from Russia detected! Secure now: http://secure-google-login.xyz",
]

EDGE_LEGIT = [
    "Hi Rahul, this is Dr. Sharma's office calling to confirm your appointment tomorrow at 3 PM.",
    "Your Amazon Prime membership has been renewed for another year.",
    "Hello! Just a friendly reminder about your gym membership renewal next week.",
    "Your Uber trip on Sunday cost $12.50. Rate your driver to help improve service.",
    "HDFC Bank: Your salary credit of Rs.45,000 has been processed on 03-Apr.",
    "IRCTC: Your train ticket PNR 8573625491 is confirmed. Journey on 08-Apr from Delhi to Mumbai.",
    "Google: A new sign-in to your account from Chrome on Windows. Was this you?",
    "Congratulations on completing your Python course! Your certificate is ready.",
    "Team standup in 15 minutes. Join via Zoom: https://zoom.us/j/123456789",
    "Your Swiggy order is on the way! Estimated delivery in 25 minutes.",
]

# ─── Build Dataset ───────────────────────────────────────────────

print("\n[1/5] Generating dataset...")

N_EACH = 2000   # per sub-category, reduced for quick update

fraud_data = (
    gen_phishing_urls(N_EACH) +
    gen_fraud_texts(N_EACH * 2) +
    EDGE_FRAUD * 100
)
legit_data = (
    gen_legit_urls(N_EACH) +
    gen_legit_texts(N_EACH * 2) +
    EDGE_LEGIT * 100
)

texts  = fraud_data + legit_data
labels = [1] * len(fraud_data) + [0] * len(legit_data)

# Shuffle
combined = list(zip(texts, labels))
random.shuffle(combined)
texts, labels = zip(*combined)

print(f"    Total samples: {len(texts):,} | Fraud: {labels.count(1):,} | Legit: {labels.count(0):,}")

# ─── Feature Engineering ─────────────────────────────────────────

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

# ─── Vectorizers ────────────────────────────────────────────────

print("[2/5] Splitting & vectorizing...")

X_train, X_test, y_train, y_test = train_test_split(
    list(texts), list(labels), test_size=0.15, random_state=42, stratify=list(labels)
)

# TF-IDF (char + word)
tfidf_word = TfidfVectorizer(
    max_features=30_000,
    ngram_range=(1, 3),
    sublinear_tf=True,
    strip_accents="unicode",
    analyzer="word",
    min_df=2,
)
tfidf_char = TfidfVectorizer(
    max_features=15_000,
    ngram_range=(2, 5),
    sublinear_tf=True,
    analyzer="char_wb",
    min_df=3,
)
hf = HandcraftedFeatures()

print("    Fitting word TF-IDF...")
X_train_w = tfidf_word.fit_transform(X_train)
X_test_w  = tfidf_word.transform(X_test)

print("    Fitting char TF-IDF...")
X_train_c = tfidf_char.fit_transform(X_train)
X_test_c  = tfidf_char.transform(X_test)

print("    Extracting handcrafted features...")
X_train_h = hf.fit_transform(X_train)
X_test_h  = hf.transform(X_test)

# Combine all features
X_train_all = hstack([X_train_w, X_train_c, X_train_h])
X_test_all  = hstack([X_test_w,  X_test_c,  X_test_h])

# ─── Train Models ───────────────────────────────────────────────

print("\n[3/5] Training XGBoost...")
xgb = XGBClassifier(
    n_estimators=500,
    max_depth=7,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    eval_metric="logloss",
    random_state=42,
    n_jobs=-1,
    tree_method="hist",
)
xgb.fit(X_train_all, y_train, verbose=False)

print("[4/5] Training Logistic Regression (calibration ensemble)...")
lr = LogisticRegression(
    C=1.0, max_iter=1000, solver="lbfgs", n_jobs=-1, random_state=42
)
lr.fit(X_train_all, y_train)

# ─── Evaluate ───────────────────────────────────────────────────

print("\n[5/5] Evaluation...\n")
y_prob_xgb = xgb.predict_proba(X_test_all)[:, 1]
y_prob_lr  = lr.predict_proba(X_test_all)[:, 1]
y_prob_ens = 0.7 * y_prob_xgb + 0.3 * y_prob_lr   # weighted ensemble
y_pred_ens = (y_prob_ens >= 0.5).astype(int)

print("=== Ensemble (XGB 70% + LR 30%) ===")
print(classification_report(y_test, y_pred_ens, target_names=["legitimate", "fraud"]))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob_ens):.4f}\n")

# ─── Save Bundle ────────────────────────────────────────────────

bundle = {
    "tfidf_word": tfidf_word,
    "tfidf_char": tfidf_char,
    "handcrafted": hf,
    "xgb": xgb,
    "lr": lr,
    "version": "3.0",
}

with open(MODELS_DIR / "tfidf.pkl", "wb") as f:
    pickle.dump(tfidf_word, f)          # legacy compat key

with open(MODELS_DIR / "model.pkl", "wb") as f:
    pickle.dump(xgb, f)                 # legacy compat key

with open(MODELS_DIR / "bundle.pkl", "wb") as f:
    pickle.dump(bundle, f)

print("✓ Saved: models/bundle.pkl  (full ensemble)")
print("✓ Saved: models/model.pkl   (XGB, legacy)")
print("✓ Saved: models/tfidf.pkl   (word TF-IDF, legacy)")
print("\n  Start the API with: uvicorn main:app --reload --port 8000")
print("=" * 65)
