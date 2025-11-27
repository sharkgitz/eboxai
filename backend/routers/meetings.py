from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services import meeting_service
from typing import List, Dict, Any

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"],
)

@router.get("/", response_model=List[Dict[str, Any]])
def get_meetings(db: Session = Depends(get_db)):
    return meeting_service.get_upcoming_meetings(db)

@router.post("/{meeting_id}/brief")
def generate_brief(meeting_id: str, db: Session = Depends(get_db)):
    brief = meeting_service.generate_meeting_brief(db, meeting_id)
    if not brief:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return brief
