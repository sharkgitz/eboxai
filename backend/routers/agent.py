from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.database import get_db, SessionLocal
from backend.services import agent_service

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
    # In a real app, this would be more robust. For now, just process first 20.
    from backend.models import Email
    emails = db.query(Email).limit(20).all()
    for email in emails:
        background_tasks.add_task(run_process_email_background, email.id)
    return {"message": "Batch processing started"}

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
