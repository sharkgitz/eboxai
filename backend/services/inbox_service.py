import json
import os
from sqlalchemy.orm import Session
from backend.models import Email, Prompt, FollowUp, ActionItem
from backend.schemas import EmailCreate
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MOCK_INBOX_PATH = os.path.join(DATA_DIR, "mock_inbox.json")
DEFAULT_PROMPTS_PATH = os.path.join(DATA_DIR, "default_prompts.json")

def load_mock_data(db: Session):
    # Load Emails
    if db.query(Email).count() == 0:
        if os.path.exists(MOCK_INBOX_PATH):
            with open(MOCK_INBOX_PATH, "r") as f:
                emails_data = json.load(f)
                
                # Base time reference: Today at 9 AM
                base_time = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)
                
                for i, email_data in enumerate(emails_data):
                    # Dynamic timestamp adjustment
                    # Distribute emails over the last few days and some in the future for meetings
                    if "Meeting" in email_data["subject"]:
                        # Meetings in the near future
                        offset = i % 3
                        email_time = base_time + timedelta(days=offset)
                    else:
                        # Other emails in the past
                        offset = (i % 5) + 1
                        email_time = base_time - timedelta(days=offset)
                        
                    email_data["timestamp"] = email_time
                    
                    # Set defaults for new fields
                    email_data.setdefault("sentiment", "neutral")
                    email_data.setdefault("emotion", "neutral")
                    email_data.setdefault("urgency_score", 5)
                for prompt_data in prompts_data:
                    db_prompt = Prompt(**prompt_data)
                    db.add(db_prompt)
            db.commit()

def get_emails(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Email).offset(skip).limit(limit).all()

def get_email(db: Session, email_id: str):
    return db.query(Email).filter(Email.id == email_id).first()
