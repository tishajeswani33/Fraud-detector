"""
train_sample.py
---------------
Trains a sample SMS-spam XGBoost + TF-IDF model so you can run the API
locally WITHOUT needing your own dataset.

Usage:
    cd backend
    python train_sample.py
    # -> writes models/model.pkl and models/tfidf.pkl
"""

import pickle
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from xgboost import XGBClassifier

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

print("Preparing training data...")

# Embedded sample data — covers common spam/fraud patterns
spam_texts = [
    "Free entry in 2 a wkly comp to win FA Cup final tkts 21st May 2005.",
    "WINNER!! As a valued network customer you have been selected to receive a £900 prize reward!",
    "Had your mobile 11 months or more? U R entitled to Update to the latest colour mobiles with camera for Free!",
    "SIX chances to win CASH! From 100 to 20,000 pounds txt> CSH11 and send to 87575.",
    "URGENT! You have won a 1 week FREE membership in our £100,000 Prize Jackpot!",
    "Congratulations ur awarded 500 of bonus points. Call now 09061701461. Landline only.",
    "FREE MESSAGE: Thanks for using our mobile service. You've been selected for a £500 prize.",
    "IMPORTANT: You've been chosen to receive a FREE Nokia phone! Call now to claim!",
    "Your account has been compromised. Click here immediately to reset your password and claim your refund.",
    "Act now! Limited time offer - get $1000 cash prize deposited directly into your account!",
    "You have been selected to receive a special reward. Reply YES to claim your free holiday!",
    "CONGRATULATIONS! Your mobile number has won £2000 in our weekly draw. Call to claim now!",
    "URGENT: Your bank account needs verification. Text back YES to avoid suspension immediately.",
    "Free ringtone! Reply to this message and get a free polyphonic ringtone sent to your phone!",
    "You've won a brand new iPhone! Click this link to claim before the offer expires!",
]

ham_texts = [
    "Nah I don't think he goes to usf, he lives around here though",
    "Even my brother is not like to speak with me. They treat me like aids patent.",
    "I'm gonna be home soon and i don't want to talk about this stuff anymore tonight, k?",
    "I've been searching for the right words to thank you for this breather.",
    "Hey, are you free for lunch tomorrow? I was thinking of that new place.",
    "Will you be able to pick up the kids from school today? I'm running late at work.",
    "The meeting has been rescheduled to 3pm tomorrow. Please update your calendar.",
    "Just finished reading that book you recommended. It was really good, thanks!",
    "Can you grab some milk on the way home? We're also running low on bread.",
    "Happy birthday! Hope you have a wonderful day. See you at the party tonight!",
    "Running 10 mins late for dinner, traffic is terrible. Save me a seat!",
    "Thanks for helping me move last weekend. I really appreciate it.",
    "Did you see the game last night? That last minute goal was incredible!",
    "Mom says dinner is at 7. Don't forget to bring the dessert.",
    "Just wanted to check if you received the documents I sent yesterday.",
]

# Duplicate to create more training data
texts = (spam_texts + ham_texts) * 30
labels = ([1] * len(spam_texts) + [0] * len(ham_texts)) * 30

X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42
)

print(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")

print("Fitting TF-IDF...")
tfidf = TfidfVectorizer(
    max_features=10_000,
    ngram_range=(1, 2),
    sublinear_tf=True,
    strip_accents="unicode",
)
X_train_vec = tfidf.fit_transform(X_train)
X_test_vec = tfidf.transform(X_test)

print("Training XGBoost...")
model = XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.1,
    eval_metric="logloss",
    random_state=42,
)
model.fit(X_train_vec, y_train)

y_pred = model.predict(X_test_vec)
print(classification_report(y_test, y_pred, target_names=["legitimate", "fraud"]))

with open(MODELS_DIR / "tfidf.pkl", "wb") as f:
    pickle.dump(tfidf, f)

with open(MODELS_DIR / "model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Saved models/tfidf.pkl and models/model.pkl")
print("You can now start the API with: uvicorn main:app --reload --port 8000")
