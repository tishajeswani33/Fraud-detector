import sys
import os
import importlib
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("diagnostic")

def check_pkg(pkg):
    try:
        importlib.import_module(pkg)
        return True
    except ImportError:
        return False

print("=" * 60)
print("  FraudShield v3.0 Diagnostic Tool")
print("=" * 60)

# Check Python
print(f"Python Version: {sys.version.split()[0]} - {'OK' if sys.version_info >= (3,8) else 'OLD'}")

# Check Packages
pkgs = ["fastapi", "uvicorn", "sklearn", "xgboost", "sqlalchemy", "pymysql", "scipy"]
print("\n[Packages Status]")
for p in pkgs:
    status = "INSTALLED" if check_pkg(p) else "MISSING"
    print(f"  {p:<12}: {status}")

# Check Models
print("\n[AI Models Status]")
model_dir = "./models"
files = ["model.pkl", "tfidf.pkl", "bundle.pkl"]
if os.path.exists(model_dir):
    for f in files:
        exists = os.path.exists(os.path.join(model_dir, f))
        print(f"  {f:<12}: {'FOUND' if exists else 'NOT FOUND'}")
else:
    print(f"  Error: {model_dir} directory not found.")

# Try DB Connection
print("\n[Database Status]")
try:
    from database import DATABASE_URL, _db_mode, init_db
    print(f"  Target DB: {DATABASE_URL}")
    success = init_db()
    if success:
        print(f"  Connection: SUCCESS (Mode: {_db_mode})")
    else:
        print(f"  Connection: FAILED (Fallback to SQLite if configured)")
except Exception as e:
    print(f"  Error loading DB scripts: {e}")

print("\n" + "=" * 60)
print("  Ready to Launch?")
print("  1. Run Backend:  uvicorn main:app --reload --port 8000")
print("  2. Run Frontend: npm run dev (in /frontend folder)")
print("=" * 60)
