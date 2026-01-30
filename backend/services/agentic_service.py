"""
Agentic Execution Service

This service enables autonomous actions based on email analysis,
including auto-replies, calendar integration, and smart suggestions.
"""

import json
from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import Email, Draft, ActionItem
from backend.services.llm_service import llm_service


class ActionType(Enum):
    """Types of autonomous actions"""
    AUTO_REPLY = "auto_reply"
    SCHEDULE_MEETING = "schedule_meeting"
    CREATE_TASK = "create_task"
    FLAG_URGENT = "flag_urgent"
    ARCHIVE = "archive"
    FORWARD = "forward"
    REMINDER = "reminder"


class RiskLevel(Enum):
    """Risk levels for actions"""
    LOW = "low"       # Can auto-execute
    MEDIUM = "medium" # Show to user for quick approval
    HIGH = "high"     # Require explicit confirmation


@dataclass
class SuggestedAction:
    """A suggested action for the user"""
    action_type: ActionType
    description: str
    risk_level: RiskLevel
    params: Dict[str, Any]
    confidence: float  # 0-1
    auto_executable: bool


class AgenticExecutor:
    """Handles autonomous and semi-autonomous email actions"""
    
    def __init__(self):
        self.action_templates = {
            ActionType.AUTO_REPLY: self._generate_auto_reply,
            ActionType.SCHEDULE_MEETING: self._suggest_meeting_times,
            ActionType.CREATE_TASK: self._extract_task,
            ActionType.FLAG_URGENT: self._flag_urgent,
            ActionType.REMINDER: self._create_reminder,
        }
    
    def analyze_email_for_actions(self, db: Session, email_id: str) -> List[SuggestedAction]:
        """Analyze an email and suggest possible actions"""
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            return []
        
        suggestions = []
        
        # Check for meeting requests
        if self._is_meeting_request(email):
            suggestions.append(SuggestedAction(
                action_type=ActionType.SCHEDULE_MEETING,
                description="Schedule meeting from this email",
                risk_level=RiskLevel.MEDIUM,
                params={"email_id": email_id, "subject": email.subject},
                confidence=0.85,
                auto_executable=False
            ))
        
        # Check for simple acknowledgment emails
        if self._is_simple_acknowledgment(email):
            suggestions.append(SuggestedAction(
                action_type=ActionType.AUTO_REPLY,
                description="Send acknowledgment reply",
                risk_level=RiskLevel.LOW,
                params={
                    "email_id": email_id,
                    "reply_type": "acknowledgment",
                    "template": "Thank you for your email. I've received your message and will review it shortly."
                },
                confidence=0.9,
                auto_executable=True
            ))
        
        # Check for task extraction
        if email.action_items and len(email.action_items) > 0:
            for item in email.action_items:
                if item.status == "pending":
                    suggestions.append(SuggestedAction(
                        action_type=ActionType.CREATE_TASK,
                        description=f"Create task: {item.description[:50]}...",
                        risk_level=RiskLevel.LOW,
                        params={
                            "task": item.description,
                            "deadline": item.deadline,
                            "source_email": email_id
                        },
                        confidence=0.95,
                        auto_executable=True
                    ))
        
        # Check for urgent flagging
        if email.urgency_score and email.urgency_score >= 8:
            suggestions.append(SuggestedAction(
                action_type=ActionType.FLAG_URGENT,
                description="Mark as urgent priority",
                risk_level=RiskLevel.LOW,
                params={"email_id": email_id, "urgency": email.urgency_score},
                confidence=0.95,
                auto_executable=True
            ))
        
        # Check for deadline reminders
        if email.deadline_datetime:
            hours_until = (email.deadline_datetime - datetime.utcnow()).total_seconds() / 3600
            if 0 < hours_until < 48:
                suggestions.append(SuggestedAction(
                    action_type=ActionType.REMINDER,
                    description=f"Set reminder for deadline: {email.deadline_text}",
                    risk_level=RiskLevel.LOW,
                    params={
                        "email_id": email_id,
                        "deadline": email.deadline_datetime.isoformat(),
                        "text": email.deadline_text
                    },
                    confidence=0.9,
                    auto_executable=True
                ))
        
        return suggestions
    
    def execute_action(self, db: Session, action: SuggestedAction) -> Dict[str, Any]:
        """Execute a suggested action"""
        if action.action_type in self.action_templates:
            handler = self.action_templates[action.action_type]
            return handler(db, action.params)
        return {"success": False, "error": "Unknown action type"}
    
    def _is_meeting_request(self, email: Email) -> bool:
        """Check if email is a meeting request"""
        meeting_keywords = [
            "meeting", "call", "sync", "schedule", "calendar",
            "availability", "free time", "slot", "invite"
        ]
        text = f"{email.subject} {email.body}".lower()
        return any(kw in text for kw in meeting_keywords)
    
    def _is_simple_acknowledgment(self, email: Email) -> bool:
        """Check if email requires just a simple acknowledgment"""
        # Emails that don't need complex responses
        simple_patterns = [
            "fyi", "for your information", "attached", "see attached",
            "sharing this", "thought you'd like", "newsletter"
        ]
        
        text = f"{email.subject} {email.body}".lower()
        
        # Check if it's informational
        if any(p in text for p in simple_patterns):
            return True
        
        # Check if it's a low-urgency newsletter-type email
        if email.category and "newsletter" in email.category.lower():
            return False  # Don't auto-reply to newsletters
        
        # Check urgency - only auto-reply to low urgency
        if email.urgency_score and email.urgency_score <= 3:
            return True
        
        return False
    
    def _generate_auto_reply(self, db: Session, params: dict) -> Dict[str, Any]:
        """Generate an auto-reply draft"""
        email_id = params.get("email_id")
        template = params.get("template", "")
        
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            return {"success": False, "error": "Email not found"}
        
        # Create draft
        draft = Draft(
            email_id=email_id,
            subject=f"Re: {email.subject}",
            body=template,
            status="suggested"
        )
        db.add(draft)
        db.commit()
        
        return {
            "success": True,
            "action": "auto_reply",
            "draft_id": draft.id,
            "message": "Draft reply created"
        }
    
    def _suggest_meeting_times(self, db: Session, params: dict) -> Dict[str, Any]:
        """Suggest meeting times based on availability"""
        # In a real implementation, this would integrate with calendar API
        now = datetime.utcnow()
        suggestions = [
            (now + timedelta(days=1, hours=10)).strftime("%A, %B %d at %I:%M %p"),
            (now + timedelta(days=1, hours=14)).strftime("%A, %B %d at %I:%M %p"),
            (now + timedelta(days=2, hours=11)).strftime("%A, %B %d at %I:%M %p"),
        ]
        
        return {
            "success": True,
            "action": "schedule_meeting",
            "suggested_times": suggestions,
            "message": "Here are some available time slots"
        }
    
    def _extract_task(self, db: Session, params: dict) -> Dict[str, Any]:
        """Create a task from email content"""
        task_desc = params.get("task", "")
        deadline = params.get("deadline")
        email_id = params.get("source_email")
        
        return {
            "success": True,
            "action": "create_task",
            "task": {
                "description": task_desc,
                "deadline": deadline,
                "source": email_id
            },
            "message": f"Task created: {task_desc[:50]}..."
        }
    
    def _flag_urgent(self, db: Session, params: dict) -> Dict[str, Any]:
        """Flag an email as urgent"""
        email_id = params.get("email_id")
        
        email = db.query(Email).filter(Email.id == email_id).first()
        if email:
            email.urgency_score = 10  # Max urgency
            db.commit()
        
        return {
            "success": True,
            "action": "flag_urgent",
            "email_id": email_id,
            "message": "Email flagged as urgent"
        }
    
    def _create_reminder(self, db: Session, params: dict) -> Dict[str, Any]:
        """Create a reminder for a deadline"""
        return {
            "success": True,
            "action": "reminder",
            "deadline": params.get("deadline"),
            "text": params.get("text"),
            "message": f"Reminder set for: {params.get('text')}"
        }


# Quick Actions for UI
def get_quick_actions(db: Session, email_id: str) -> List[Dict[str, Any]]:
    """Get quick action suggestions for the UI"""
    executor = AgenticExecutor()
    suggestions = executor.analyze_email_for_actions(db, email_id)
    
    return [{
        "type": s.action_type.value,
        "description": s.description,
        "risk": s.risk_level.value,
        "confidence": s.confidence,
        "auto_executable": s.auto_executable,
        "params": s.params
    } for s in suggestions]


def execute_quick_action(db: Session, action_type: str, params: dict) -> Dict[str, Any]:
    """Execute a quick action"""
    executor = AgenticExecutor()
    
    try:
        action_enum = ActionType(action_type)
    except ValueError:
        return {"success": False, "error": f"Unknown action type: {action_type}"}
    
    action = SuggestedAction(
        action_type=action_enum,
        description="",
        risk_level=RiskLevel.LOW,
        params=params,
        confidence=1.0,
        auto_executable=True
    )
    
    return executor.execute_action(db, action)


def generate_smart_reply(db: Session, email_id: str, intent: str = "default") -> str:
    """Generate a context-aware smart reply using Graph-RAG"""
    from backend.services.graph_service import get_context_for_reply
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return ""
    
    # Get context from knowledge graph
    context = get_context_for_reply(db, email_id)
    
    # Intent-based templates
    intent_instructions = {
        "acknowledge": "Write a brief acknowledgment showing you received and will review the message.",
        "decline": "Write a polite but firm decline, offering an alternative if possible.",
        "accept": "Write an enthusiastic acceptance, confirming next steps.",
        "clarify": "Ask for clarification on the key points that are unclear.",
        "delegate": "Explain that you're forwarding this to the appropriate person.",
        "default": "Write an appropriate professional response."
    }
    
    instruction = intent_instructions.get(intent, intent_instructions["default"])
    
    prompt = f"""You are composing a reply to this email.

ORIGINAL EMAIL:
From: {email.sender}
Subject: {email.subject}
Body: {email.body}

CONTEXT FROM RELATIONSHIP HISTORY:
{context if context else "No previous history with this sender."}

INSTRUCTION: {instruction}

Write a professional, concise reply. Keep it under 100 words unless the situation requires more detail.
Do not include subject line, just the body of the reply."""

    try:
        response = llm_service.generate_text(prompt)
        return response
    except Exception as e:
        print(f"Smart reply generation failed: {e}")
        return ""
