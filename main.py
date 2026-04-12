import sys
import os

# Render start commands run from the root by default.
# We redirect standard execution to the backend folder smoothly.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
os.chdir('backend')

from main import app
