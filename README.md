# FraudShield v3.0 — Advanced Fraud Detection Suite

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-blue?style=flat)](https://xgboost.ai/)
[![Ensemble](https://img.shields.io/badge/Model-Ensemble-red?style=flat)](https://scikit-learn.org/)

**FraudShield** is a premium, high-accuracy SMS, text, and link fraud detection platform. It uses an advanced **Ensemble AI model** (XGBoost + Logistic Regression) trained on 60,000+ multi-category samples to identify phishing, social engineering, and banking scams with millisecond latency.

### ✨ Premium Features

*   **⚡ Ensemble Intelligence**: A weighted voting system between two high-performance classifiers for maximum accuracy and calibration.
*   **🌐 Multi-Language Detection**: Specialized training for English, Hinglish, and symbolic fraud patterns.
*   **📊 Live Analytics Dashboard**: Real-time visualization of threats, risk distributions, and system latency backed by MySQL/SQLite.
*   **📱 Universal Response**: Fully mobile and desktop responsive UI with premium glassmorphism aesthetics and micro-animations.
*   **🛡️ Signal Analysis**: Deep-dive into specific fraud indicators (Urgency, Phishing TLDs, IP URLs, Monetary bait).
*   **🔄 Hybrid Database**: Automatic failover between MySQL (Production) and SQLite (Local Development).

### 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLModel, Uvicorn.
- **Machine Learning**: Scikit-Learn, XGBoost, Scipy (TF-IDF Vectorization).
- **Database**: MySQL / SQLite.

### 🚀 Getting Started

#### 1. Clone & Install
```bash
git clone https://github.com/tishajeswani33/fraud-detector.git
cd fraud-detector
```

#### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# (Optional) Set MYSQL_URL in .env
python train_sample.py  # Trains the full v3.0 model
uvicorn main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 📈 Future Roadmap
- [ ] Real-time browser extension integration
- [ ] Support for image-based OCR fraud detection
- [ ] User-contributed threat database

Built with ❤️ for a safer web.
