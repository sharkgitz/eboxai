from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Email(Base):
    __tablename__ = "emails"

    id = Column(String, primary_key=True, index=True)
    sender = Column(String, index=True)
    subject = Column(String, index=True)
    body = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    category = Column(String, default="Uncategorized")
    is_read = Column(Boolean, default=False)
    
    # Relationships
    action_items = relationship("ActionItem", back_populates="email")
    drafts = relationship("Draft", back_populates="email")

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    template = Column(Text)
    prompt_type = Column(String) # categorization, extraction, reply, chat

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"))
    description = Column(String)
    deadline = Column(String, nullable=True)
    status = Column(String, default="pending")

    email = relationship("Email", back_populates="action_items")

class Draft(Base):
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"))
    subject = Column(String)
    body = Column(Text)
    status = Column(String, default="draft") # draft, saved

    email = relationship("Email", back_populates="drafts")
