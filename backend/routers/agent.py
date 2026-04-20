from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.database import get_db, SessionLocal
from backend.services import agent_service

import time

def run_process_email_background(email_id: str):
    """
    Wrapper to run process_email in a background task with its own DB session.
    FastAPI's Depends(get_db) session is closed after the request finishes,
    so we must create a new session for background tasks.
    """
    db = SessionLocal()
    try:
        agent_service.process_email(db, email_id)
    finally:
        db.close()


def run_batch_process_background(email_ids: list):
    """
    Process multiple emails SEQUENTIALLY with a delay between each call.
    This avoids hitting free-tier rate limits on Groq/Gemini during demos.
    """
    for i, email_id in enumerate(email_ids):
        db = SessionLocal()
        try:
            agent_service.process_email(db, email_id)
        except Exception as e:
            # Log but don't crash the whole batch
            print(f"Error processing {email_id}: {e}")
        finally:
            db.close()

        # Throttle: wait 1.5s between API calls to respect rate limits
        if i < len(email_ids) - 1:
            time.sleep(1.5)


router = APIRouter(
    prefix="/agent",
    tags=["agent"],
)

class ChatRequest(BaseModel):
    query: str
    email_id: Optional[str] = None

class DraftRequest(BaseModel):
    email_id: str
    instructions: str = None
    tone: str = "professional"
    length: str = "concise"

@router.post("/process/{email_id}")
def process_email_endpoint(email_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Run in background to not block UI
    background_tasks.add_task(run_process_email_background, email_id)
    return {"message": "Processing started"}

@router.post("/process-all")
def process_all_emails(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Process all emails sequentially with throttling to avoid rate limits."""
    from backend.models import Email
    emails = db.query(Email).limit(20).all()
    email_ids = [email.id for email in emails]
    # Single sequential background task instead of 20 concurrent ones
    background_tasks.add_task(run_batch_process_background, email_ids)
    return {"message": f"Batch processing started for {len(email_ids)} emails (sequential)"}

@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    response = agent_service.chat_agent(db, request.query, request.email_id)
    return {"response": response}

@router.post("/draft")
def create_draft(request: DraftRequest, db: Session = Depends(get_db)):
    draft = agent_service.generate_draft(db, request.email_id, request.instructions, request.tone, request.length)
    if not draft:
        raise HTTPException(status_code=400, detail="Could not generate draft")
    return draft

# --- Agentic Capabilities (Moved from agentic.py to ensure loading) ---
from backend.services import agentic_service
from typing import Dict, Any

class ActionRequest(BaseModel):
    action_type: str
    params: Dict[str, Any]

class SmartReplyRequest(BaseModel):
    email_id: str
    intent: str = "default"

@router.get("/actions/{email_id}")
def get_suggested_actions(email_id: str, db: Session = Depends(get_db)):
    try:
        actions = agentic_service.get_quick_actions(db, email_id)
        return {"email_id": email_id, "actions": actions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
def execute_action(request: ActionRequest, db: Session = Depends(get_db)):
    try:
        result = agentic_service.execute_quick_action(db, request.action_type, request.params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/smart-reply")
def generate_smart_reply(request: SmartReplyRequest, db: Session = Depends(get_db)):
    try:
        reply = agentic_service.generate_smart_reply(db, request.email_id, request.intent)
        return {"email_id": request.email_id, "intent": request.intent, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/intents")
def get_available_intents():
    return {
        "intents": [
            {"id": "acknowledge", "label": "Acknowledge", "description": "Brief acknowledgment of receipt"},
            {"id": "accept", "label": "Accept", "description": "Accept a request or invitation"},
            {"id": "decline", "label": "Decline", "description": "Politely decline"},
            {"id": "clarify", "label": "Clarify", "description": "Ask for more information"},
            {"id": "delegate", "label": "Delegate", "description": "Forward to appropriate person"},
            {"id": "default", "label": "Auto", "description": "AI chooses the best response type"},
        ]
    }
