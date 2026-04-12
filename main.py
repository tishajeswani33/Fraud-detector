import sys
import os
import importlib.util

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir(backend_path)
sys.path.insert(0, backend_path)

# Dynamically load the backend's main.py to avoid circular import collision with this root proxy
spec = importlib.util.spec_from_file_location("backend_main", os.path.join(backend_path, "main.py"))
backend_main = importlib.util.module_from_spec(spec)
sys.modules["backend_main"] = backend_main
spec.loader.exec_module(backend_main)

app = backend_main.app
