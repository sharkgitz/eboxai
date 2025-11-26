from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ActionItem
from pydantic import BaseModel

router = APIRouter(
    prefix="/action-items",
    tags=["action-items"],
)

class ActionItemUpdate(BaseModel):
    status: str

@router.patch("/{item_id}")
def update_action_item(item_id: int, item_update: ActionItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Action item not found")
    
    db_item.status = item_update.status
    db.commit()
    db.refresh(db_item)
    return db_item
