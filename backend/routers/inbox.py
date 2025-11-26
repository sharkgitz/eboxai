from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.services import inbox_service
from backend.schemas import Email, EmailDetail

router = APIRouter(
    prefix="/inbox",
    tags=["inbox"],
)

@router.post("/load")
def load_inbox(db: Session = Depends(get_db)):
    inbox_service.load_mock_data(db)
    return {"message": "Inbox loaded successfully"}

@router.get("/", response_model=List[EmailDetail])
def read_emails(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    emails = inbox_service.get_emails(db, skip=skip, limit=limit)
    return emails

@router.delete("/{email_id}")
def delete_email(email_id: str, db: Session = Depends(get_db)):
    from backend.models import Email
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    db.delete(email)
    db.commit()
    return {"message": "Email deleted"}

@router.get("/{email_id}", response_model=EmailDetail)
def read_email(email_id: str, db: Session = Depends(get_db)):
    db_email = inbox_service.get_email(db, email_id=email_id)
    if db_email is None:
        raise HTTPException(status_code=404, detail="Email not found")
    return db_email
