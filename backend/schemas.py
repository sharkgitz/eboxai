from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Email Schemas
class EmailBase(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    timestamp: datetime
    category: str = "Uncategorized"
    is_read: bool = False
    
    # Sentiment & Urgency
    sentiment: str = "neutral"
    urgency_score: int = 5
    
    # Deadline-Aware Prioritization  
    deadline_datetime: Optional[datetime] = None
    deadline_text: Optional[str] = None
    
    # Dark Patterns
    has_dark_patterns: bool = False

class EmailCreate(EmailBase):
    pass

class Email(EmailBase):
    class Config:
        orm_mode = True

# Action Item Schemas
class ActionItemBase(BaseModel):
    description: str
    deadline: Optional[str] = None
    status: str = "pending"

class ActionItemCreate(ActionItemBase):
    email_id: str

class ActionItem(ActionItemBase):
    id: int
    email_id: str
    class Config:
        orm_mode = True

# Prompt Schemas
class PromptBase(BaseModel):
    name: str
    template: str
    prompt_type: str

class PromptCreate(PromptBase):
    pass

class Prompt(PromptBase):
    id: int
    class Config:
        orm_mode = True

# Draft Schemas
class DraftBase(BaseModel):
    subject: str
    body: str
    status: str = "draft"

class DraftCreate(DraftBase):
    email_id: str

class Draft(DraftBase):
    id: int
    email_id: str
    class Config:
        orm_mode = True

# Composite Response
class EmailDetail(Email):
    action_items: List[ActionItem] = []
    drafts: List[Draft] = []
