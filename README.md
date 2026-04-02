# 🛡 FraudScan — AI Fraud Detection App

Real-time fraud & spam detection powered by **XGBoost + TF-IDF**.
Backend: **FastAPI** on Render · Frontend: **React + Tailwind** on Vercel

## 📁 Folder Structure

```
fraud-detection/
├── backend/
│   ├── main.py              ← FastAPI app (POST /predict)
│   ├── requirements.txt     ← Python dependencies
│   ├── render.yaml          ← Render deployment config
│   ├── model.pkl            ← YOU MUST ADD THIS
│   ├── tfidf.pkl            ← YOU MUST ADD THIS
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── GaugeChart.jsx
    │   │   ├── ResultPanel.jsx
    │   │   └── SampleMessages.jsx
    │   ├── hooks/usePredict.js
    │   └── utils/api.js
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── vercel.json
```

## ⚙️ Local Setup

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Copy model.pkl and tfidf.pkl into backend/
uvicorn main:app --reload --port 8000
```
API docs → http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # points to localhost:8000
npm run dev
# → http://localhost:5173
```

## 🔌 API

### POST /predict
```json
// Request
{ "text": "Congrats! You won $1000. Click now!" }

// Response
{
  "label": "fraud",
  "fraud_probability": 0.9412,
  "confidence": 0.9412,
  "model_name": "sms_spam_model",
  "model_accuracy": 0.9665
}
```

## 🚀 Deployment

### Backend → Render
1. Push to GitHub (include model.pkl + tfidf.pkl)
2. New Web Service → Root: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Env var: `ALLOWED_ORIGINS=https://your-app.vercel.app`

### Frontend → Vercel
1. New Project → Root: `frontend`
2. Env var: `VITE_API_URL=https://your-render-app.onrender.com`
3. Deploy

## 🤖 Model Files

```python
# Retrain snippet
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBClassifier
import pickle

tfidf = TfidfVectorizer(max_features=5000)
X = tfidf.fit_transform(texts)
model = XGBClassifier(n_estimators=200, max_depth=6)
model.fit(X, labels)

pickle.dump(tfidf, open('tfidf.pkl', 'wb'))
pickle.dump(model, open('model.pkl', 'wb'))
```
