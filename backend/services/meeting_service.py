from sqlalchemy.orm import Session
from backend.models import Email
from backend.services.llm_service import llm_service
from datetime import datetime, timedelta
import json

def get_upcoming_meetings(db: Session):
    """
    Scans emails for potential meetings and returns a list of 'upcoming' meetings.
    For demo purposes, we'll simulate finding meetings in recent emails.
    """
    # Find emails with meeting-related keywords
    keywords = ["meeting", "zoom", "invite", "schedule", "calendar", "sync"]
    
    meetings = []
    emails = db.query(Email).all()
    
    for email in emails:
        is_meeting = any(k in email.subject.lower() or k in email.body.lower() for k in keywords)
        if is_meeting:
            # Simulate a meeting time based on email timestamp (e.g., 2 days after email)
            meeting_time = email.timestamp + timedelta(days=2)
            
            meetings.append({
                "id": f"mtg_{email.id}",
                "title": f"Discuss: {email.subject}",
                "datetime": meeting_time.isoformat(),
                "participants": [email.sender, "me"],
                "source_email_id": email.id,
                "status": "upcoming"
            })
    
    # Sort by date
    meetings.sort(key=lambda x: x["datetime"])
    return meetings

def generate_meeting_brief(db: Session, meeting_id: str):
    """
    Generates a preparation brief for a specific meeting using the LLM.
    """
    # Extract email ID from meeting ID
    email_id = meeting_id.replace("mtg_", "")
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        return None
        
    prompt = f"""
    You are an executive assistant preparing a meeting brief.
    
    Based on this email thread, generate a concise meeting preparation brief.
    
    Email Subject: {email.subject}
    Sender: {email.sender}
    Body:
    {email.body}
    
    Output JSON format:
    {{
        "summary": "1-2 sentence summary of the context",
        "key_points": ["point 1", "point 2", "point 3"],
        "suggested_talking_points": ["question 1", "proposal 1"],
        "sentiment": "positive/neutral/negative/tense"
    }}
    """
    
    try:
        response = llm_service.generate_response(prompt)
        # Clean up potential markdown code blocks
        cleaned_response = response.replace("```json", "").replace("```", "").strip()
        brief = json.loads(cleaned_response)
        return brief
    except Exception as e:
        print(f"Error generating brief: {e}")
        return {
            "summary": "Could not generate brief.",
            "key_points": [],
            "suggested_talking_points": [],
            "sentiment": "neutral"
        }
