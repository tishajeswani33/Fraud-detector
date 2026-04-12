import os
import logging
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError
from datetime import datetime

logger = logging.getLogger("fraud-api")

# Advanced Database Fallback: MySQL -> SQLite (Local)
MYSQL_URL = os.getenv("MYSQL_URL")
SQLITE_URL = "sqlite:///./fraud_detector.db"

# Determine which DB to use (prefer MySQL)
DATABASE_URL = MYSQL_URL if MYSQL_URL else SQLITE_URL

Base = declarative_base()

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    label = Column(String(50))
    fraud_probability = Column(Float)
    legitimate_probability = Column(Float)
    confidence = Column(Float)
    inference_ms = Column(Float)
    risk_level = Column(String(20))
    signals = Column(Text)  # Stored as JSON string
    model_version = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

engine = None
SessionLocal = None
_db_mode = "NONE"

def init_db():
    global engine, SessionLocal, _db_mode
    
    # Try preferred DB
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        Base.metadata.create_all(bind=engine)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        _db_mode = "MYSQL" if MYSQL_URL else "SQLITE"
        logger.info(f"Database initialized successfully using {_db_mode} mode.")
        return True
    except OperationalError as e:
        if DATABASE_URL != SQLITE_URL:
            logger.warning(f"MySQL connection failed: {e}. Falling back to SQLite...")
            try:
                engine = create_engine(SQLITE_URL)
                Base.metadata.create_all(bind=engine)
                SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
                _db_mode = "SQLITE"
                logger.info("Local SQLite database initialized as fallback.")
                return True
            except Exception as e2:
                logger.error(f"SQLite fallback failed: {e2}")
        else:
            logger.error(f"Database initialization failed: {e}")
            
    engine = None
    SessionLocal = None
    _db_mode = "ERROR"
    return False

def get_db():
    """Dependency for getting a database session."""
    if SessionLocal:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    else:
        yield None

def log_prediction_to_db(result: dict, text: str):
    """Background task to log predictions to either MySQL or SQLite."""
    if not SessionLocal:
        return
        
    db = SessionLocal()
    try:
        signals_json = json.dumps(result.get("signals", []))
        
        db_log = PredictionLog(
            text=text,
            label=result.get("label", ""),
            fraud_probability=result.get("fraud_probability", 0.0),
            legitimate_probability=result.get("legitimate_probability", 0.0),
            confidence=result.get("confidence", 0.0),
            inference_ms=result.get("inference_ms", 0.0),
            risk_level=result.get("risk_level", "UNKNOWN"),
            signals=signals_json,
            model_version=result.get("model_version", "unknown")
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log prediction to db: {e}")
        db.rollback()
    finally:
        db.close()

def get_stats():
    """Helper to get analytics data directly from the DB."""
    if not SessionLocal:
        return None
        
    db = SessionLocal()
    try:
        from sqlalchemy import func
        
        total_count = db.query(PredictionLog).count()
        fraud_count = db.query(PredictionLog).filter(PredictionLog.label == "fraud").count()
        avg_inference = db.query(func.avg(PredictionLog.inference_ms)).scalar() or 0.0
        
        # Count by risk level
        risk_counts = db.query(PredictionLog.risk_level, func.count(PredictionLog.id)).group_by(PredictionLog.risk_level).all()
        risk_dist = {r: c for r, c in risk_counts}
        
        # Ensure all risk levels are present in dist
        for rl in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "SAFE"]:
            if rl not in risk_dist: risk_dist[rl] = 0
        
        return {
            "total_scans": total_count,
            "fraud_detected": fraud_count,
            "avg_inference_ms": round(float(avg_inference), 2),
            "risk_distribution": risk_dist,
            "status": f"connected ({_db_mode})"
        }
    except Exception as e:
        logger.error(f"Error fetching stats from {_db_mode}: {e}")
        return None
    finally:
        db.close()
