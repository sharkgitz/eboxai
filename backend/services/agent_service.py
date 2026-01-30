import json
from sqlalchemy.orm import Session
from backend.models import Email, Prompt, ActionItem, Draft, FollowUp
from backend.services.llm_service import llm_service
from backend.services.sentiment_service import analyze_sentiment
from backend.services.dark_patterns_service import detect_dark_patterns
from backend.services.followup_service import extract_followups

def process_email(db: Session, email_id: str):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        print(f"ProcessEmail: Email {email_id} not found")
        return None

    # TRACE: Set status immediately to prove task is running
    print(f"ProcessEmail: Starting analysis for {email_id}")
    email.category = "Analyzing..."
    try:
        db.commit()
    except Exception as e:
        print(f"ProcessEmail: Failed to commit initial status: {e}")
        db.rollback()

    # 1. Dark Patterns Detection (Regex-based, free, keep separate)
    dark_patterns_result = detect_dark_patterns(email.subject, email.body)
    email.has_dark_patterns = dark_patterns_result.get("has_dark_patterns", False)
    email.dark_patterns = json.dumps(dark_patterns_result.get("patterns_found", []))
    email.dark_pattern_severity = dark_patterns_result.get("severity", "low")

    # 2. Comprehensive LLM Analysis (Consolidating 4 calls into 1)
    # Combined prompt for Sentiment, Category, Actions, Followups, and Deadline
    prompt_text = f"""Analyze this email and provide a comprehensive JSON response.

Subject: {email.subject}
From: {email.sender}
Body: {email.body}

Return a single JSON object with the following structure:
{{
    "category": "Work: Important" | "Work: Routine" | "Personal" | "Spam" | "Newsletter" | "Finance" | "Travel" | "Social" | "Promotions" | "General",
    "category_reasoning": "Short explanation of why this category was chosen",
    "urgency_score": 1-10 (10 being most urgent),
    "deadline": {{
        "has_deadline": true/false,
        "deadline_text": "original text like 'by 5 PM today' or 'before Friday' or null",
        "deadline_iso": "ISO 8601 datetime string or null (e.g., '2026-01-30T17:00:00')"
    }},
    "action_items": [
        {{ "description": "task description", "deadline": "date or null" }}
    ],
    "followups": [
        {{ "commitment": "what was promised", "committed_by": "me" or sender_email, "due_date": "date or null" }}
    ]
}}

Classification Guidelines:
- "Work: Important": Direct requests from boss/colleagues, project updates, meeting invites.
- "Work: Routine": Automated system notifications, generic HR announcements, low priority.
- "Finance": Bills, receipts, bank notifications, salary.
- "Travel": Flight confirmations, hotel bookings, ride share receipts.
- "Newsletter": News digests, substack, marketing emails from known brands.
- "Spam": Unsolicited offers, phishing attempts, lottery wins.
- "Social": LinkedIn notifications, Facebook/Twitter updates.
- "Promotions": Sales, discounts, limited time offers.
- "General": Use this if NO other category fits.

Urgency Guidelines:
- 10: Explicit deadline within 2 hours or ASAP
- 8-9: Deadline today or tomorrow
- 6-7: Deadline within the week
- 4-5: No explicit deadline but action required
- 1-3: Informational, no action needed

IMPORTANT: You MUST choose one of the categories above. Do NOT use "Uncategorized".
Look for temporal phrases like "need this by", "deadline is", "before EOD", "ASAP", "urgent", etc.

Respond ONLY with the valid JSON object."""

    try:
        response = llm_service.generate_text(prompt_text, json_mode=True)
        
        # DEBUG: Log response to file
        try:
            with open("debug_response.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- RESPONSE ---\n{response}\n----------------\n")
        except:
            pass
        
        # Try direct JSON parse first (JSON mode should be clean)
        data = {}
        try:
            data = json.loads(response)
        except:
            # Fallback to regex if model added text around it
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                except:
                    pass

        if not data:
            raise Exception("Empty/Invalid JSON")
        
        # Populate Email Fields
        email.sentiment = data.get("sentiment", "neutral")
        email.emotion = data.get("emotion", "neutral")
        email.urgency_score = data.get("urgency_score", 5)
        
        # Extract Deadline Information
        deadline_data = data.get("deadline", {})
        if deadline_data and deadline_data.get("has_deadline"):
            email.deadline_text = deadline_data.get("deadline_text")
            deadline_iso = deadline_data.get("deadline_iso")
            if deadline_iso:
                try:
                    from datetime import datetime as dt
                    email.deadline_datetime = dt.fromisoformat(deadline_iso.replace('Z', '+00:00'))
                except:
                    pass
        
        # Default to "Err: Key" checking so we know if model missed the key
        email.category = data.get("category", "Err: Missing Key")
        
        # Populate Actions
        actions = data.get("action_items", [])
        for action in actions:
            db_action = ActionItem(
                email_id=email.id,
                description=action.get("description", "Unknown task"),
                deadline=action.get("deadline")
            )
            db.add(db_action)
            
        # Populate Followups
        followups = data.get("followups", [])
        for followup in followups:
            db_followup = FollowUp(
                email_id=email.id,
                commitment=followup.get("commitment", ""),
                committed_by=followup.get("committed_by", email.sender),
                due_date=followup.get("due_date")
            )
            db.add(db_followup)

    except Exception as e:
        print(f"Comprehensive analysis failed: {e}")
        # DEBUG: Write error to category field
        email.category = f"Err: {str(e)[:20]}" 
        email.sentiment = "neutral"

    db.commit()
    return email

def generate_draft(db: Session, email_id: str, instructions: str = None, tone: str = "professional", length: str = "concise"):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return None

    reply_prompt = db.query(Prompt).filter(Prompt.prompt_type == "reply").first()
    if reply_prompt:
        template = reply_prompt.template
        
        # Inject style guidelines
        template += f"\n\nStyle Guidelines:\n- Tone: {tone}\n- Length: {length}"

        if instructions:
            template += f"\n\nAdditional Instructions: {instructions}"
        
        prompt_text = template.replace("{body}", email.body)
        draft_body = llm_service.generate_text(prompt_text)
        
        draft = Draft(
            email_id=email.id,
            subject=f"Re: {email.subject}",
            body=draft_body
        )
        db.add(draft)
        db.commit()
        return draft
    return None

from backend.services.rag_service import rag_service

def chat_agent(db: Session, query: str, email_id: str = None):
    context = ""
    if email_id:
        email = db.query(Email).filter(Email.id == email_id).first()
        if email:
            context = f"Context Email:\nSender: {email.sender}\nSubject: {email.subject}\nBody: {email.body}\n\n"
    else:
        # RAG Search
        # Use Pinecone to find relevant context
        relevant_emails = []
        
        if not rag_service.is_mock:
            # Search Pinecone for relevant emails
            rag_results = rag_service.search(query, k=5)
            # rag_results is list of metadata dicts, convert to pseudo Email objects for context
            for r in rag_results:
                relevant_emails.append(type('Email', (), r)()) # Create simple object from dict
        
        # Fallback: If RAG returns nothing (or query is generic "summarize"), fetch recent emails from DB
        if not relevant_emails or "summarize" in query.lower():
            # Get recent emails if RAG failed or for summary queries
            relevant_emails = db.query(Email).order_by(Email.timestamp.desc()).limit(10).all()
        
        if relevant_emails:
            context = "Here are the most relevant/recent emails found in the inbox:\n\n"
            for e in relevant_emails:
                context += f"ID: {e.id}\nSender: {e.sender}\nSubject: {e.subject}\nDate: {e.timestamp}\nBody: {e.body[:300]}...\nCategory: {e.category}\n\n"
            context += "End of relevant emails.\n\n"

    prompt = f"You are a helpful Email Productivity Agent. You have access to the user's emails provided in the context below.\n\nIMPORTANT: Format your response using Markdown. Use headers (##) for sections, bullet points (-) for lists, and bolding (**) for emphasis. Do not output a single block of text.\n\n{context}User Query: {query}\n\nAgent Response:"
    return llm_service.generate_text(prompt)
