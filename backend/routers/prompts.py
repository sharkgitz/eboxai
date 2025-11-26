from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Prompt as DBPrompt
from backend.schemas import Prompt, PromptCreate

router = APIRouter(
    prefix="/prompts",
    tags=["prompts"],
)

@router.get("/", response_model=List[Prompt])
def read_prompts(db: Session = Depends(get_db)):
    return db.query(DBPrompt).all()

@router.post("/", response_model=Prompt)
def create_prompt(prompt: PromptCreate, db: Session = Depends(get_db)):
    db_prompt = DBPrompt(**prompt.dict())
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.put("/{prompt_id}", response_model=Prompt)
def update_prompt(prompt_id: int, prompt: PromptCreate, db: Session = Depends(get_db)):
    db_prompt = db.query(DBPrompt).filter(DBPrompt.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    for key, value in prompt.dict().items():
        setattr(db_prompt, key, value)
    
    db.commit()
    db.refresh(db_prompt)
    return db_prompt
