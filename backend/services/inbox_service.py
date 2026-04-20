import json
import os
import pandas as pd
from sqlalchemy.orm import Session
from backend.models import Email, Prompt, FollowUp, ActionItem
from backend.schemas import EmailCreate
from backend.logger import get_logger
from datetime import datetime, timedelta
from pathlib import Path

logger = get_logger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MOCK_INBOX_PATH = DATA_DIR / "mock_inbox.json"
DEFAULT_PROMPTS_PATH = DATA_DIR / "default_prompts.json"

# Import the new advanced classifier
from backend.services.classifier_v2 import classifier, predict_category as _predict_v2


def predict_category(subject: str, body: str, sender: str = "") -> tuple[str, float]:
    """
    Predict email category using the advanced classifier v2.
    Returns (category, confidence) tuple.
    """
    return _predict_v2(subject, body, sender)


def load_mock_data(db: Session):
    logger.info(f"Attempting to load mock data from: {MOCK_INBOX_PATH}")
    
    # Load Emails
    if db.query(Email).count() == 0:
        if MOCK_INBOX_PATH.exists():
            logger.info("Mock inbox file found. Loading...")
            with open(MOCK_INBOX_PATH, "r") as f:
                emails_data = json.load(f)
                
                # Base time reference: Today at 9 AM
                base_time = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)
                
                for i, email_data in enumerate(emails_data):
                    # Dynamic timestamp adjustment
                    if "Meeting" in email_data["subject"]:
                        offset = i % 3
                        email_time = base_time + timedelta(days=offset)
                    else:
                        offset = (i % 5) + 1
                        email_time = base_time - timedelta(days=offset)
                        
                    email_data["timestamp"] = email_time
                    
                    # Set defaults for new fields
                    email_data.setdefault("sentiment", "neutral")
                    email_data.setdefault("emotion", "neutral")
                    email_data.setdefault("urgency_score", 5)
                    email_data.setdefault("has_dark_patterns", False)
                    email_data.setdefault("dark_patterns", "[]")
                    email_data.setdefault("dark_pattern_severity", "low")
                    
                    # -------------------------------------------------------
                    # ADVANCED CLASSIFIER: Use local model for classification
                    # -------------------------------------------------------
                    category, confidence = predict_category(
                        email_data["subject"], 
                        email_data["body"],
                        email_data.get("sender", "")
                    )
                    email_data["category"] = category
                    email_data["confidence_score"] = confidence
                    logger.info(f"🤖 Classified: '{email_data['subject'][:30]}...' -> {category} ({confidence:.0%})")
                    # -------------------------------------------------------

                    db_email = Email(**email_data)
                    db.add(db_email)
            db.commit()
            logger.info(f"Loaded {len(emails_data)} emails successfully.")
        else:
            logger.error(f"Mock inbox file NOT found at {MOCK_INBOX_PATH}")
            raise FileNotFoundError(f"Mock inbox file not found at {MOCK_INBOX_PATH}")
    else:
        logger.info("Emails already exist in DB. Skipping email load.")

    # Seed FollowUps and ActionItems if missing
    if db.query(FollowUp).count() == 0:
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
        if DEFAULT_PROMPTS_PATH.exists():
            with open(DEFAULT_PROMPTS_PATH, "r") as f:
                prompts_data = json.load(f)
                for prompt_data in prompts_data:
                    db_prompt = Prompt(**prompt_data)
                    db.add(db_prompt)
            db.commit()


def get_emails(db: Session, skip: int = 0, limit: int = 100, sort_by: str = "date"):
    """
    Get emails with optional sorting.
    
    sort_by options:
    - "date": Sort by timestamp (default, newest first)
    - "priority": Smart priority sorting (urgency + deadline awareness)
    """
    from sqlalchemy import case, desc, asc, nullslast
    
    query = db.query(Email)
    
    if sort_by == "priority":
        now = datetime.utcnow()
        
        priority_case = case(
            (Email.deadline_datetime.isnot(None) & (Email.deadline_datetime <= now + timedelta(hours=24)), 100),
            (Email.urgency_score >= 8, 80),
            (Email.urgency_score >= 6, 60),
            (Email.deadline_datetime.isnot(None), 40),
            (Email.is_read == False, 30),
            else_=10
        )
        
        query = query.order_by(
            desc(priority_case),
            asc(nullslast(Email.deadline_datetime)),
            desc(Email.urgency_score),
            desc(Email.timestamp)
        )
    else:
        query = query.order_by(desc(Email.timestamp))
    
    return query.offset(skip).limit(limit).all()


def get_email(db: Session, email_id: str):
    return db.query(Email).filter(Email.id == email_id).first()
