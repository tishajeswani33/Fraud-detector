import sys
import os

# Redirect root execution of train_sample.py to the backend folder smoothly.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
os.chdir('backend')

with open('train_sample.py') as f:
    code = compile(f.read(), 'train_sample.py', 'exec')
    exec(code, globals())
