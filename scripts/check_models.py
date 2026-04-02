"""
check_models.py  —  validate model.pkl and tfidf.pkl before deployment.
Run from the backend/ directory:  python ../scripts/check_models.py
"""
import pickle, sys
from pathlib import Path

MODELS = Path("models")
errors = []

def check(name):
    path = MODELS / name
    if not path.exists():
        errors.append(f"MISSING: {path}")
        return None
    with open(path, "rb") as f:
        obj = pickle.load(f)
    print(f"  OK  {name}  ->  {type(obj).__name__}")
    return obj

print("=== Checking model files ===")
tfidf = check("tfidf.pkl")
model = check("model.pkl")

if errors:
    for e in errors: print(f"  !! {e}")
    sys.exit(1)

print("\n=== Quick inference test ===")
vec = tfidf.transform(["Congratulations! You've won a prize. Call now!"])
if hasattr(model, "predict_proba"):
    print(f"  predict_proba: {model.predict_proba(vec)[0]}")
    print(f"  classes: {model.classes_}")
else:
    print(f"  decision_function: {model.decision_function(vec)[0]}")

print("\nAll checks passed. Ready to deploy.")
