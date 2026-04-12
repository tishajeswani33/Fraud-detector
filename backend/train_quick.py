"""
train_quick.py — Sub-60 Second Quick Train for Immediate Testing
================================================================
"""
import pickle
import random
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

# Small sample set
texts = [
    "URGENT: Your account at Bank of America is suspended. Verify now: http://boa-secure.xyz",
    "Congratulations! You won a $1000 gift card. Call 09061701461 to claim.",
    "Bhai 50000 ki lottery lagi hai, link par click karo jaldi: http://lottery-win.tk",
    "Aapka bank account block ho gaya hai. KYC update karein: http://kyc-bank.in",
    "Mom, it's me. Need $200 urgently. Use Western Union.",
    "Hey, are we still meeting for dinner tomorrow at 7?",
    "Can you send me the presentation slides for the meeting?",
    "Dinner is ready! Come downstairs.",
    "Happy Birthday! Hope you have a great day.",
    "Bhai kaha hai tu? Kaha milna hai aaj?",
    "https://www.google.com",
    "https://github.com/microsoft",
] * 100 # Multiplied for 1200 samples

labels = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0] * 100

print("Fitting Quick Model...")
tfidf = TfidfVectorizer(max_features=2500, ngram_range=(1,2))
X = tfidf.fit_transform(texts)

model = XGBClassifier(n_estimators=50, max_depth=3, learning_rate=0.1)
model.fit(X, labels)

with open(MODELS_DIR / "tfidf.pkl", "wb") as f:
    pickle.dump(tfidf, f)
with open(MODELS_DIR / "model.pkl", "wb") as f:
    pickle.dump(model, f)

print("✓ Quick model saved to models/. Ready for testing!")
