"""
Agentic API Router

Endpoints for autonomous actions, quick actions, and smart replies.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from backend.database import get_db
from backend.services import agentic_service

router = APIRouter(
    prefix="/agentic",
    tags=["agentic"],
)


class ActionRequest(BaseModel):
    action_type: str
    params: Dict[str, Any]


class SmartReplyRequest(BaseModel):
    email_id: str
    intent: str = "default"  # acknowledge, decline, accept, clarify, delegate, default


@router.get("/actions/{email_id}")
def get_suggested_actions(email_id: str, db: Session = Depends(get_db)):
    """Get AI-suggested actions for an email"""
    try:
        actions = agentic_service.get_quick_actions(db, email_id)
        return {"email_id": email_id, "actions": actions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
def execute_action(request: ActionRequest, db: Session = Depends(get_db)):
    """Execute a quick action"""
    try:
        result = agentic_service.execute_quick_action(
            db, 
            request.action_type, 
            request.params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smart-reply")
def generate_smart_reply(request: SmartReplyRequest, db: Session = Depends(get_db)):
    """Generate a context-aware smart reply"""
    try:
        reply = agentic_service.generate_smart_reply(
            db,
            request.email_id,
            request.intent
        )
        return {
            "email_id": request.email_id,
            "intent": request.intent,
            "reply": reply
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/intents")
def get_available_intents():
    """Get available reply intents"""
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
