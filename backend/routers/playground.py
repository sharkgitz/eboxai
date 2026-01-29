from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models import Email
from backend.services.llm_service import llm_service

router = APIRouter(
    prefix="/playground",
    tags=["playground"],
)

class TestPromptRequest(BaseModel):
    email_id: str
    template: str

@router.post("/test")
def test_prompt(request: TestPromptRequest, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == request.email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    # Simple variable substitution
    prompt_text = request.template.replace("{subject}", email.subject).replace("{body}", email.body).replace("{sender}", email.sender)
    
    try:
        response = llm_service.generate_text(prompt_text)
        return {"response": response}
    except Exception as e:
        print(f"Playground Error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")
