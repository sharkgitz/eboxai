import json
import os
from sqlalchemy.orm import Session
from backend.models import Email, Prompt
from backend.schemas import EmailCreate
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MOCK_INBOX_PATH = os.path.join(DATA_DIR, "mock_inbox.json")
DEFAULT_PROMPTS_PATH = os.path.join(DATA_DIR, "default_prompts.json")

def load_mock_data(db: Session):
    # Load Emails
    if db.query(Email).count() == 0:
        if os.path.exists(MOCK_INBOX_PATH):
            with open(MOCK_INBOX_PATH, "r") as f:
                emails_data = json.load(f)
                for email_data in emails_data:
                    # Convert timestamp string to datetime
                    email_data["timestamp"] = datetime.fromisoformat(email_data["timestamp"])
                    db_email = Email(**email_data)
                    db.add(db_email)
            db.commit()

    # Load Prompts
    if db.query(Prompt).count() == 0:
        if os.path.exists(DEFAULT_PROMPTS_PATH):
            with open(DEFAULT_PROMPTS_PATH, "r") as f:
                prompts_data = json.load(f)
                for prompt_data in prompts_data:
                    db_prompt = Prompt(**prompt_data)
                    db.add(db_prompt)
            db.commit()

def get_emails(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Email).offset(skip).limit(limit).all()

def get_email(db: Session, email_id: str):
    return db.query(Email).filter(Email.id == email_id).first()
