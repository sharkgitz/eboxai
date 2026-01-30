"""
Graph-RAG Context Memory Service

This service builds and queries a knowledge graph from email interactions
to provide context-aware AI responses.
"""

import json
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import Email

class ContactNode:
    """Represents a contact in the knowledge graph"""
    def __init__(self, email: str):
        self.email = email
        self.name: Optional[str] = None
        self.company: Optional[str] = None
        self.role: Optional[str] = None
        self.interaction_count: int = 0
        self.last_interaction: Optional[datetime] = None
        self.sentiment_history: List[str] = []
        self.topics: List[str] = []
        self.priority_level: str = "normal"  # low, normal, high, vip

    def to_dict(self) -> dict:
        return {
            "email": self.email,
            "name": self.name,
            "company": self.company,
            "role": self.role,
            "interaction_count": self.interaction_count,
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
            "avg_sentiment": self._calculate_avg_sentiment(),
            "topics": self.topics[:5],  # Top 5 topics
            "priority_level": self.priority_level
        }

    def _calculate_avg_sentiment(self) -> str:
        if not self.sentiment_history:
            return "neutral"
        positive = sum(1 for s in self.sentiment_history if s == "positive")
        negative = sum(1 for s in self.sentiment_history if s == "negative")
        if positive > negative:
            return "positive"
        elif negative > positive:
            return "negative"
        return "neutral"


class KnowledgeGraph:
    """In-memory knowledge graph for email context"""
    
    def __init__(self):
        self.contacts: Dict[str, ContactNode] = {}
        self.relationships: Dict[str, Dict[str, str]] = defaultdict(dict)  # email -> {related_email: relationship_type}
        self.topics_to_contacts: Dict[str, List[str]] = defaultdict(list)
        
    def add_or_update_contact(self, email: str, **kwargs) -> ContactNode:
        """Add or update a contact node"""
        if email not in self.contacts:
            self.contacts[email] = ContactNode(email)
        
        node = self.contacts[email]
        for key, value in kwargs.items():
            if hasattr(node, key) and value:
                setattr(node, key, value)
        
        return node
    
    def record_interaction(self, email: str, sentiment: str = "neutral", 
                          topics: List[str] = None, timestamp: datetime = None):
        """Record an interaction with a contact"""
        node = self.add_or_update_contact(email)
        node.interaction_count += 1
        node.sentiment_history.append(sentiment)
        node.last_interaction = timestamp or datetime.utcnow()
        
        if topics:
            for topic in topics:
                if topic not in node.topics:
                    node.topics.append(topic)
                if email not in self.topics_to_contacts[topic]:
                    self.topics_to_contacts[topic].append(email)
        
        # Auto-upgrade priority based on interaction count
        if node.interaction_count >= 10:
            node.priority_level = "vip"
        elif node.interaction_count >= 5:
            node.priority_level = "high"
    
    def add_relationship(self, email1: str, email2: str, relationship_type: str):
        """Add a relationship between two contacts"""
        self.relationships[email1][email2] = relationship_type
        self.relationships[email2][email1] = relationship_type
    
    def get_contact_context(self, email: str) -> Optional[dict]:
        """Get full context for a contact"""
        if email not in self.contacts:
            return None
        return self.contacts[email].to_dict()
    
    def get_related_contacts(self, email: str) -> List[dict]:
        """Get contacts related to a given email"""
        related = []
        if email in self.relationships:
            for related_email, rel_type in self.relationships[email].items():
                if related_email in self.contacts:
                    contact_dict = self.contacts[related_email].to_dict()
                    contact_dict["relationship"] = rel_type
                    related.append(contact_dict)
        return related
    
    def find_contacts_by_topic(self, topic: str) -> List[dict]:
        """Find contacts associated with a topic"""
        contacts = []
        topic_lower = topic.lower()
        for t, emails in self.topics_to_contacts.items():
            if topic_lower in t.lower():
                for email in emails:
                    if email in self.contacts:
                        contacts.append(self.contacts[email].to_dict())
        return contacts
    
    def get_vip_contacts(self) -> List[dict]:
        """Get high-priority/VIP contacts"""
        return [c.to_dict() for c in self.contacts.values() 
                if c.priority_level in ("high", "vip")]


# Global knowledge graph instance
_knowledge_graph = KnowledgeGraph()


def get_knowledge_graph() -> KnowledgeGraph:
    """Get the global knowledge graph instance"""
    return _knowledge_graph


def build_graph_from_emails(db: Session):
    """Build/update knowledge graph from all emails in database"""
    graph = get_knowledge_graph()
    
    emails = db.query(Email).all()
    
    for email in emails:
        # Extract sender info
        sender = email.sender
        if sender:
            graph.record_interaction(
                email=sender,
                sentiment=email.sentiment or "neutral",
                topics=_extract_topics(email.subject, email.body),
                timestamp=email.timestamp
            )
            
            # Try to extract name/company from sender format "Name <email@domain.com>"
            name, company = _parse_sender(sender)
            if name:
                graph.add_or_update_contact(sender, name=name)
            if company:
                graph.add_or_update_contact(sender, company=company)


def _extract_topics(subject: str, body: str) -> List[str]:
    """Extract topics from email subject and body"""
    topics = []
    
    # Common topic keywords
    topic_keywords = {
        "meeting": ["meeting", "call", "sync", "standup", "review"],
        "project": ["project", "sprint", "milestone", "deadline", "delivery"],
        "report": ["report", "analysis", "summary", "metrics", "data"],
        "sales": ["deal", "proposal", "quote", "contract", "client"],
        "support": ["issue", "problem", "help", "support", "ticket"],
        "finance": ["invoice", "payment", "budget", "expense", "billing"],
        "hiring": ["interview", "candidate", "resume", "offer", "job"],
        "marketing": ["campaign", "launch", "press", "announcement", "event"]
    }
    
    text = f"{subject} {body}".lower()
    
    for topic, keywords in topic_keywords.items():
        if any(kw in text for kw in keywords):
            topics.append(topic)
    
    return topics


def _parse_sender(sender: str) -> Tuple[Optional[str], Optional[str]]:
    """Parse sender string to extract name and company"""
    import re
    
    name = None
    company = None
    
    # Try "Name <email>" format
    match = re.match(r'^([^<]+)\s*<([^>]+)>$', sender)
    if match:
        name = match.group(1).strip()
        email_part = match.group(2)
    else:
        email_part = sender
    
    # Extract company from domain
    if "@" in email_part:
        domain = email_part.split("@")[1]
        # Skip common email providers
        if domain not in ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]:
            company = domain.split(".")[0].title()
    
    return name, company


def get_context_for_reply(db: Session, email_id: str) -> str:
    """Get context from knowledge graph for composing a reply"""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return ""
    
    graph = get_knowledge_graph()
    
    # Ensure graph is populated
    build_graph_from_emails(db)
    
    context_parts = []
    
    # Get sender context
    sender_context = graph.get_contact_context(email.sender)
    if sender_context:
        context_parts.append(f"Sender Context:")
        context_parts.append(f"- Name: {sender_context.get('name', 'Unknown')}")
        context_parts.append(f"- Company: {sender_context.get('company', 'Unknown')}")
        context_parts.append(f"- Previous interactions: {sender_context.get('interaction_count', 0)}")
        context_parts.append(f"- Relationship sentiment: {sender_context.get('avg_sentiment', 'neutral')}")
        context_parts.append(f"- Priority level: {sender_context.get('priority_level', 'normal')}")
        
        if sender_context.get('topics'):
            context_parts.append(f"- Common topics: {', '.join(sender_context['topics'])}")
    
    # Get related contacts
    related = graph.get_related_contacts(email.sender)
    if related:
        context_parts.append(f"\nRelated Contacts:")
        for r in related[:3]:  # Top 3
            context_parts.append(f"- {r.get('name', r.get('email'))}: {r.get('relationship', 'colleague')}")
    
    return "\n".join(context_parts)


def get_context_for_chat(db: Session, query: str) -> str:
    """Get relevant context from knowledge graph for chat responses"""
    graph = get_knowledge_graph()
    
    # Ensure graph is populated
    build_graph_from_emails(db)
    
    context_parts = []
    
    # Find relevant contacts based on query
    for topic in _extract_topics(query, ""):
        contacts = graph.find_contacts_by_topic(topic)
        if contacts:
            context_parts.append(f"Contacts related to '{topic}':")
            for c in contacts[:3]:
                context_parts.append(f"- {c.get('name', c.get('email'))}")
    
    # Include VIP contacts
    vips = graph.get_vip_contacts()
    if vips:
        context_parts.append(f"\nHigh-priority contacts to consider:")
        for v in vips[:5]:
            context_parts.append(f"- {v.get('name', v.get('email'))} ({v.get('interaction_count')} interactions)")
    
    return "\n".join(context_parts)
