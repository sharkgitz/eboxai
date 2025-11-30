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
    print(f"Attempting to load mock data from: {MOCK_INBOX_PATH}")
    
    # Load Emails
    if db.query(Email).count() == 0:
        if os.path.exists(MOCK_INBOX_PATH):
            print("Mock inbox file found. Loading...")
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
                    email_data.setdefault("has_dark_patterns", False)
                    email_data.setdefault("dark_patterns", "[]")  # JSON string
                    email_data.setdefault("dark_pattern_severity", "low")
                    
                    db_email = Email(**email_data)
                    db.add(db_email)
            db.commit()
            print("Emails loaded successfully.")
        else:
            print(f"ERROR: Mock inbox file NOT found at {MOCK_INBOX_PATH}")
            raise FileNotFoundError(f"Mock inbox file not found at {MOCK_INBOX_PATH}")
    else:
        print("Emails already exist in DB. Skipping email load.")

    # Seed FollowUps and ActionItems if missing (even if emails exist)
    if db.query(FollowUp).count() == 0:
        # Find relevant emails
        q4_email = db.query(Email).filter(Email.subject.contains("Q4 Report")).first()
        sprint_email = db.query(Email).filter(Email.subject.contains("Sprint Planning")).first()
        
        base_time = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)

        if q4_email:
            db.add(FollowUp(
                email_id=q4_email.id,
                commitment="Send Q4 report",
                committed_by="me",
                due_date=(base_time + timedelta(days=1)).strftime("%Y-%m-%d"),
                status="pending"
            ))
            db.add(ActionItem(
                email_id=q4_email.id,
                description="Compile sales figures for Q4",
                deadline="Tomorrow",
                status="pending"
            ))
            
        if sprint_email:
             db.add(FollowUp(
                email_id=sprint_email.id,
                commitment="Attend Sprint Planning",
                committed_by="me",
                due_date=(base_time + timedelta(days=2)).strftime("%Y-%m-%d"),
                status="pending"
            ))
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
