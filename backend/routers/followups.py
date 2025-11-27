from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import FollowUp
from pydantic import BaseModel

router = APIRouter(
    prefix="/followups",
    tags=["followups"],
)

class FollowUpUpdate(BaseModel):
    status: str

@router.get("/")
def get_followups(db: Session = Depends(get_db)):
    """Get all follow-up reminders"""
    followups = db.query(FollowUp).all()
    return followups

@router.patch("/{followup_id}")
def update_followup(followup_id: int, update: FollowUpUpdate, db: Session = Depends(get_db)):
    """Update follow-up status"""
    followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if followup:
        followup.status = update.status
        db.commit()
    return followup
