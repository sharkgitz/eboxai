
import json
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models
from backend.models import Email, ActionItem

# Create tables if they don't exist (just in case)
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    try:
        # Clear existing
        try:
            db.query(ActionItem).delete()
            db.query(Email).delete()
            db.commit()
            print("Cleared existing data.")
        except Exception as e:
            print(f"Error clearing data: {e}")
            db.rollback()

        # Mock Data Generator
        emails = [
            {
                "id": "msg_001",
                "sender": "boss@company.com",
                "subject": "URGENT: Q4 Financials Required",
                "body": "I need the Q4 financial report by EOD tomorrow. This is critical for the board meeting.",
                "category": "Work",
                "urgency_score": 9,
                "deadline_text": "Tomorrow EOD",
                "confidence_score": 0.92,
                "sentiment": "negative", # Stressful
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=2)
            },
            {
                "id": "msg_002",
                "sender": "newsletter@ai-weekly.com",
                "subject": "The Rise of Agentic AI",
                "body": "This week we explore how AI agents are transforming workflows...",
                "category": "Newsletter",
                "urgency_score": 2,
                "confidence_score": 0.98,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=5)
            },
             {
                "id": "msg_003",
                "sender": "client.sarah@bigcorp.com",
                "subject": "Feedback on Designs - Action Needed",
                "body": "Hi, we love the direction but need 3 changes by Friday. 1. Logo size. 2. Color palette. 3. Typography.",
                "category": "Client",
                "urgency_score": 8,
                "deadline_text": "Friday",
                "confidence_score": 0.85,
                "sentiment": "neutral",
                "rag_sources": ["design_guidelines_v2.pdf"],
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=1)
            },
            {
                "id": "msg_004",
                "sender": "billing@aws.com",
                "subject": "Invoice for October 2023",
                "body": "Your invoice #12345 is ready. Amount: $450.00. Auto-pay on Nov 1st.",
                "category": "Finance",
                "urgency_score": 5,
                "deadline_text": "Nov 1st",
                "confidence_score": 0.99,
                "is_read": False,
                "timestamp": datetime.now() - timedelta(days=1)
            },
            {
                "id": "msg_005",
                "sender": "recruiter@linkedin.com",
                "subject": "Opportunity: Staff Software Engineer",
                "body": "Hi, your profile looks great! Would you be open to a chat?",
                "category": "Personal",
                "urgency_score": 3,
                "confidence_score": 0.88,
                "is_read": True,
                "timestamp": datetime.now() - timedelta(days=2)
            }
        ]

        for e_data in emails:
            email = Email(
                id=e_data["id"],
                sender=e_data["sender"],
                subject=e_data["subject"],
                body=e_data["body"],
                timestamp=e_data["timestamp"],
                is_read=e_data.get("is_read", False),
                category=e_data.get("category", "Uncategorized"),
                urgency_score=e_data.get("urgency_score", 0),
                deadline_text=e_data.get("deadline_text"),
                confidence_score=e_data.get("confidence_score", 0.0),
                sentiment=e_data.get("sentiment", "neutral"),
                rag_sources=e_data.get("rag_sources", [])
            )
            db.add(email)
            
            # Add action items for msg_003
            if e_data["id"] == "msg_003":
                ai1 = ActionItem(email_id="msg_003", description="Resize logo", status="pending")
                ai2 = ActionItem(email_id="msg_003", description="Update color palette", status="pending")
                db.add(ai1)
                db.add(ai2)
                
        db.commit()
        print(f"Successfully seeded {len(emails)} emails.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
