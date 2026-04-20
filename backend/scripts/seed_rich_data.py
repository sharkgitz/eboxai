
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

        # Mock Data Generator - 20+ emails across all 10 categories
        emails = [
            # ============ WORK: IMPORTANT ============
            {
                "id": "msg_001",
                "sender": "boss@company.com",
                "subject": "URGENT: Q4 Financials Required",
                "body": "I need the Q4 financial report by EOD tomorrow. This is critical for the board meeting. Please prioritize this above all other tasks.",
                "category": "Work: Important",
                "urgency_score": 9,
                "deadline_text": "Tomorrow EOD",
                "confidence_score": 0.95,
                "sentiment": "negative",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=2)
            },
            {
                "id": "msg_002",
                "sender": "cto@company.com",
                "subject": "Critical: Production Server Down",
                "body": "We have a P0 incident. The main production database is not responding. Need all hands on deck immediately. Join the war room call ASAP.",
                "category": "Work: Important",
                "urgency_score": 10,
                "deadline_text": "Immediately",
                "confidence_score": 0.98,
                "sentiment": "negative",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(minutes=30)
            },
            {
                "id": "msg_003",
                "sender": "client.sarah@bigcorp.com",
                "subject": "Feedback on Designs - Action Needed",
                "body": "Hi, we love the direction but need 3 changes by Friday. 1. Increase logo size by 20%. 2. Switch to darker color palette. 3. Use Inter font for headings.",
                "category": "Work: Important",
                "urgency_score": 8,
                "deadline_text": "Friday",
                "confidence_score": 0.92,
                "sentiment": "neutral",
                "rag_sources": ["design_guidelines_v2.pdf"],
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=1)
            },
            
            # ============ WORK: ROUTINE ============
            {
                "id": "msg_004",
                "sender": "hr-noreply@company.com",
                "subject": "Timesheet Reminder: Week 45",
                "body": "Friendly reminder to submit your timesheet for this week. The deadline is Friday 5pm.",
                "category": "Work: Routine",
                "urgency_score": 3,
                "deadline_text": "Friday 5pm",
                "confidence_score": 0.96,
                "sentiment": "neutral",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(hours=8)
            },
            {
                "id": "msg_005",
                "sender": "jira@atlassian.com",
                "subject": "Weekly Sprint Summary: 5 PRs merged, 3 issues closed",
                "body": "Here's your weekly team digest: Development velocity up 15%. Sprint burndown on track. Next standup Monday 10am.",
                "category": "Work: Routine",
                "urgency_score": 2,
                "confidence_score": 0.94,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=12)
            },
            {
                "id": "msg_006",
                "sender": "it-notifications@company.com",
                "subject": "IT Maintenance Window: Sunday 2am-4am",
                "body": "Routine server maintenance is scheduled for Sunday. VPN and internal tools may be unavailable during this window.",
                "category": "Work: Routine",
                "urgency_score": 2,
                "confidence_score": 0.97,
                "sentiment": "neutral",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(days=1)
            },
            
            # ============ PERSONAL ============
            {
                "id": "msg_007",
                "sender": "mom@gmail.com",
                "subject": "Family Reunion Plans - July",
                "body": "Hi sweetie! We're planning the annual family reunion for July 15th. Can you make it? Let me know so I can book the venue. Love you!",
                "category": "Personal",
                "urgency_score": 4,
                "confidence_score": 0.91,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=6)
            },
            {
                "id": "msg_008",
                "sender": "bestfriend@gmail.com",
                "subject": "Happy Birthday! 🎉",
                "body": "Wishing you an amazing birthday! Hope your day is wonderful. Can't wait to celebrate together this weekend!",
                "category": "Personal",
                "urgency_score": 2,
                "confidence_score": 0.93,
                "sentiment": "positive",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(days=2)
            },
            
            # ============ FINANCE ============
            {
                "id": "msg_009",
                "sender": "billing@aws.com",
                "subject": "Invoice for October 2023",
                "body": "Your invoice #12345 is ready. Amount: $450.00. Auto-pay scheduled for Nov 1st. View detailed breakdown in your console.",
                "category": "Finance",
                "urgency_score": 5,
                "deadline_text": "Nov 1st",
                "confidence_score": 0.99,
                "sentiment": "neutral",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(days=1)
            },
            {
                "id": "msg_010",
                "sender": "noreply@paypal.com",
                "subject": "Payment Received: $1,200",
                "body": "You've received a payment of $1,200.00 from Client ABC Corp. The funds are now available in your PayPal balance.",
                "category": "Finance",
                "urgency_score": 3,
                "confidence_score": 0.98,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=4)
            },
            {
                "id": "msg_011",
                "sender": "alerts@chase.com",
                "subject": "Monthly Statement Available",
                "body": "Your October statement is ready. Total spending: $3,245.67. View your statement online for full details.",
                "category": "Finance",
                "urgency_score": 3,
                "confidence_score": 0.97,
                "sentiment": "neutral",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(days=3)
            },
            
            # ============ TRAVEL ============
            {
                "id": "msg_012",
                "sender": "booking@delta.com",
                "subject": "Flight Confirmation: NYC → SFO",
                "body": "Your flight is confirmed! Departs Dec 15 at 8:00am from JFK Terminal B. Confirmation code: ABC123. Check-in opens 24h before.",
                "category": "Travel",
                "urgency_score": 4,
                "deadline_text": "Dec 14",
                "confidence_score": 0.99,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=3)
            },
            {
                "id": "msg_013",
                "sender": "reservations@marriott.com",
                "subject": "Hotel Reservation Confirmed",
                "body": "Your room at San Francisco Marriott is confirmed for Dec 15-17. King room, harbor view. Check-in: 3pm.",
                "category": "Travel",
                "urgency_score": 2,
                "confidence_score": 0.98,
                "sentiment": "positive",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(hours=5)
            },
            
            # ============ NEWSLETTER ============
            {
                "id": "msg_014",
                "sender": "newsletter@ai-weekly.com",
                "subject": "The Rise of Agentic AI",
                "body": "This week we explore how AI agents are transforming workflows. Plus: GPT-5 rumors, open source LLM benchmarks, and interview with Anthropic's CEO.",
                "category": "Newsletter",
                "urgency_score": 1,
                "confidence_score": 0.98,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=7)
            },
            {
                "id": "msg_015",
                "sender": "digest@techcrunch.com",
                "subject": "TechCrunch Daily: Startup Funding Hits Record",
                "body": "Today's top stories: Y Combinator Winter batch announced. Series B funding up 40% YoY. Apple's new AI features delayed.",
                "category": "Newsletter",
                "urgency_score": 1,
                "confidence_score": 0.96,
                "sentiment": "neutral",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(hours=10)
            },
            
            # ============ SPAM ============
            {
                "id": "msg_016",
                "sender": "lottery@winner.xyz",
                "subject": "YOU WON $1,000,000!!! CLAIM NOW",
                "body": "Congratulations! You've been selected as our lucky winner! Click here to claim your prize immediately! Limited time offer!",
                "category": "Spam",
                "urgency_score": 0,
                "confidence_score": 0.99,
                "sentiment": "negative",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=2)
            },
            {
                "id": "msg_017",
                "sender": "prince@nigeria.gov.ng",
                "subject": "Urgent Business Proposal - $10M Transfer",
                "body": "Dear friend, I am a Nigerian prince seeking your help to transfer $10 million. You will receive 30% commission.",
                "category": "Spam",
                "urgency_score": 0,
                "confidence_score": 0.99,
                "sentiment": "negative",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(days=1)
            },
            
            # ============ SOCIAL ============
            {
                "id": "msg_018",
                "sender": "invitations@linkedin.com",
                "subject": "New Connection Request: Sarah Chen, VP at Google",
                "body": "Sarah Chen wants to connect with you on LinkedIn. She's a VP of Engineering at Google with 500+ connections.",
                "category": "Social",
                "urgency_score": 2,
                "confidence_score": 0.94,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=4)
            },
            {
                "id": "msg_019",
                "sender": "notification@twitter.com",
                "subject": "Your tweet went viral! 🚀",
                "body": "Your tweet about AI agents got 10K likes and 2K retweets. See who's talking about it.",
                "category": "Social",
                "urgency_score": 1,
                "confidence_score": 0.92,
                "sentiment": "positive",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(hours=8)
            },
            
            # ============ PROMOTIONS ============
            {
                "id": "msg_020",
                "sender": "deals@amazon.com",
                "subject": "50% OFF - Today Only! Lightning Deals",
                "body": "Don't miss our biggest sale of the year. Electronics, fashion, and more up to 50% off. Shop now before it ends!",
                "category": "Promotions",
                "urgency_score": 1,
                "deadline_text": "Today",
                "confidence_score": 0.97,
                "sentiment": "positive",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=3)
            },
            {
                "id": "msg_021",
                "sender": "offers@nike.com",
                "subject": "Exclusive Member Offer: 30% Off Everything",
                "body": "As a valued Nike member, enjoy 30% off your next order. Use code MEMBER30 at checkout. Valid through Sunday.",
                "category": "Promotions",
                "urgency_score": 2,
                "deadline_text": "Sunday",
                "confidence_score": 0.95,
                "sentiment": "positive",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(days=1)
            },
            
            # ============ GENERAL ============
            {
                "id": "msg_022",
                "sender": "surveys@research.com",
                "subject": "Quick Survey: Help Us Improve",
                "body": "We'd love your feedback! Takes just 2 minutes. As a thank you, you'll be entered to win a $100 gift card.",
                "category": "General",
                "urgency_score": 1,
                "confidence_score": 0.90,
                "sentiment": "neutral",
                "is_read": False,
                "timestamp": datetime.now() - timedelta(hours=6)
            },
            {
                "id": "msg_023",
                "sender": "noreply@github.com",
                "subject": "Your repository was starred",
                "body": "Congrats! email-agent-ai was starred by 5 new developers this week. Your project is gaining traction!",
                "category": "General",
                "urgency_score": 1,
                "confidence_score": 0.88,
                "sentiment": "positive",
                "is_read": True,
                "timestamp": datetime.now() - timedelta(hours=12)
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
