from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import os

# Use relative path from this file's location for portability
_BACKEND_DIR = Path(__file__).resolve().parent
_DEFAULT_DB_PATH = _BACKEND_DIR / "email_agent_v2.db"

# Allow override via environment variable for deployment flexibility
DB_PATH = os.getenv("DATABASE_PATH", str(_DEFAULT_DB_PATH))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
