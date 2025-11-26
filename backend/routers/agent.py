from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.services import agent_service

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
)

class ChatRequest(BaseModel):
    query: str
    email_id: str = None

class DraftRequest(BaseModel):
    email_id: str
    instructions: str = None

@router.post("/process/{email_id}")
def process_email_endpoint(email_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Run in background to not block UI
    background_tasks.add_task(agent_service.process_email, db, email_id)
    return {"message": "Processing started"}

@router.post("/process-all")
def process_all_emails(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # In a real app, this would be more robust. For now, just process first 20.
    from backend.models import Email
    emails = db.query(Email).limit(20).all()
    for email in emails:
        background_tasks.add_task(agent_service.process_email, db, email.id)
    return {"message": "Batch processing started"}

@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    response = agent_service.chat_agent(db, request.query, request.email_id)
    return {"response": response}

@router.post("/draft")
def create_draft(request: DraftRequest, db: Session = Depends(get_db)):
    draft = agent_service.generate_draft(db, request.email_id, request.instructions)
    if not draft:
        raise HTTPException(status_code=400, detail="Could not generate draft")
    return draft
