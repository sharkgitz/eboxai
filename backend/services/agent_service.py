import json
from sqlalchemy.orm import Session
from backend.models import Email, Prompt, ActionItem, Draft, FollowUp
from backend.services.llm_service import llm_service
from backend.services.sentiment_service import analyze_sentiment
from backend.services.dark_patterns_service import detect_dark_patterns
from backend.services.followup_service import extract_followups
from backend.services.inbox_service import predict_category
from backend.logger import get_logger

logger = get_logger(__name__)


def _parse_llm_json(response: str) -> dict:
    """
    Robustly parse JSON from an LLM response.
    Handles markdown code fences, conversational filler, and partial JSON.
    """
    import re

    if not response or not response.strip():
        return {}

    text = response.strip()

    # Step 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
    fence_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Step 2: Try direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Step 3: Find the outermost { ... } pair
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace:last_brace + 1])
        except (json.JSONDecodeError, ValueError):
            pass

    return {}


def _parse_llm_json_array(response: str) -> list:
    """
    Robustly parse a JSON array from an LLM response.
    Handles markdown code fences and conversational filler.
    """
    import re

    if not response or not response.strip():
        return []

    text = response.strip()

    # Step 1: Strip markdown code fences
    fence_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Step 2: Try direct parse
    try:
        result = json.loads(text)
        return result if isinstance(result, list) else []
    except (json.JSONDecodeError, ValueError):
        pass

    # Step 3: Find the outermost [ ... ] pair
    first_bracket = text.find('[')
    last_bracket = text.rfind(']')
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        try:
            result = json.loads(text[first_bracket:last_bracket + 1])
            return result if isinstance(result, list) else []
        except (json.JSONDecodeError, ValueError):
            pass

    return []

def process_email(db: Session, email_id: str):
    """
    Process an email using hybrid AI:
    1. Local classifier for categorization (fast, no API calls)
    2. LLM for complex tasks: action items, followups, deadline extraction
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        logger.warning(f"Email {email_id} not found")
        return None

    logger.info(f"Processing email {email_id}")
    email.category = "Analyzing..."
    try:
        db.commit()
    except Exception as e:
        logger.error(f"Failed to commit initial status: {e}")
        db.rollback()

    # =========================================================
    # STEP 1: LOCAL CLASSIFIER (fast, no API calls)
    # =========================================================
    category, confidence = predict_category(
        email.subject, 
        email.body, 
        email.sender
    )
    email.category = category
    email.confidence_score = confidence
    logger.info(f"🤖 Classified: {category} ({confidence:.0%})")

    # =========================================================
    # STEP 2: DARK PATTERNS DETECTION (regex-based, free)
    # =========================================================
    dark_patterns_result = detect_dark_patterns(email.subject, email.body)
    email.has_dark_patterns = dark_patterns_result.get("has_dark_patterns", False)
    email.dark_patterns = json.dumps(dark_patterns_result.get("patterns_found", []))
    email.dark_pattern_severity = dark_patterns_result.get("severity", "low")

    # =========================================================
    # STEP 3: LLM ANALYSIS (only for complex extraction tasks)
    # Classification is already done - LLM only extracts metadata
    # =========================================================
    prompt_text = f"""Analyze this email and extract structured information.

Subject: {email.subject}
From: {email.sender}
Body: {email.body}

Return a JSON object with ONLY the following (category is already determined):
{{
    "urgency_score": 1-10 (10 being most urgent),
    "sentiment": "positive" | "negative" | "neutral" | "urgent",
    "deadline": {{
        "has_deadline": true/false,
        "deadline_text": "original text like 'by 5 PM today' or null",
        "deadline_iso": "ISO 8601 datetime or null"
    }},
    "action_items": [
        {{ "description": "task description", "deadline": "date or null" }}
    ],
    "followups": [
        {{ "commitment": "what was promised", "committed_by": "me" or sender_email, "due_date": "date or null" }}
    ]
}}

Urgency Guidelines:
- 10: Explicit deadline within 2 hours or ASAP
- 8-9: Deadline today or tomorrow
- 6-7: Deadline within the week
- 4-5: No explicit deadline but action required
- 1-3: Informational, no action needed

Respond ONLY with valid JSON."""

    try:
        response = llm_service.generate_text(prompt_text, json_mode=True)
        
        data = _parse_llm_json(response)


        if not data:
            raise Exception("Empty/Invalid JSON from LLM")
        
        # Populate fields from LLM
        email.sentiment = data.get("sentiment", "neutral")
        email.emotion = data.get("emotion", email.sentiment)
        email.urgency_score = data.get("urgency_score", 5)
        
        # Extract deadline
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
        
        # Populate Actions
        for action in data.get("action_items", []):
            db_action = ActionItem(
                email_id=email.id,
                description=action.get("description", "Unknown task"),
                deadline=action.get("deadline")
            )
            db.add(db_action)
            
        # Populate Followups
        for followup in data.get("followups", []):
            db_followup = FollowUp(
                email_id=email.id,
                commitment=followup.get("commitment", ""),
                committed_by=followup.get("committed_by", email.sender),
                due_date=followup.get("due_date")
            )
            db.add(db_followup)

    except Exception as e:
        logger.warning(f"LLM extraction failed: {e}. Using classifier result only.")
        # Category is already set by classifier, just set defaults
        email.sentiment = "neutral"
        email.urgency_score = 5

    db.commit()
    return email


def generate_draft(db: Session, email_id: str, instructions: str = None, tone: str = "professional", length: str = "concise"):
    """Generate an AI draft reply to an email."""
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return None

    reply_prompt = db.query(Prompt).filter(Prompt.prompt_type == "reply").first()
    if reply_prompt:
        template = reply_prompt.template
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
    """Chat with the AI agent about emails."""
    context = ""
    if email_id:
        email = db.query(Email).filter(Email.id == email_id).first()
        if email:
            context = f"Context Email:\nSender: {email.sender}\nSubject: {email.subject}\nBody: {email.body}\n\n"
    else:
        relevant_emails = []
        
        if not rag_service.is_mock:
            rag_results = rag_service.search(query, k=5)
            for r in rag_results:
                relevant_emails.append(type('Email', (), r)())
        
        if not relevant_emails or "summarize" in query.lower():
            relevant_emails = db.query(Email).order_by(Email.timestamp.desc()).limit(10).all()
        
        if relevant_emails:
            context = "Here are the most relevant/recent emails found in the inbox:\n\n"
            for e in relevant_emails:
                context += f"ID: {e.id}\nSender: {e.sender}\nSubject: {e.subject}\nDate: {e.timestamp}\nBody: {e.body[:300]}...\nCategory: {e.category}\n\n"
            context += "End of relevant emails.\n\n"

    prompt = f"You are a helpful Email Productivity Agent. You have access to the user's emails provided in the context below.\n\nIMPORTANT: Format your response using Markdown. Use headers (##) for sections, bullet points (-) for lists, and bolding (**) for emphasis.\n\n{context}User Query: {query}\n\nAgent Response:"
    
    if not email_id:
        from backend.services.graph_service import get_context_for_chat
        graph_context = get_context_for_chat(db, query)
        if graph_context:
            prompt = f"""You are a helpful Email Productivity Agent.
            
RELATIONSHIP CONTEXT:
{graph_context}

EMAIL CONTEXT:
{context}

USER QUERY:
{query}

IMPORTANT: Use the Relationship Context to provide personalized answers.
Format your response using Markdown.
Agent Response:"""

    return llm_service.generate_text(prompt)
