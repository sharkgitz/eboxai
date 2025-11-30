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
        return None

    # 1. Sentiment Analysis
    sentiment_result = analyze_sentiment(email.subject, email.body)
    email.sentiment = sentiment_result.get("sentiment", "neutral")
    email.emotion = sentiment_result.get("emotion", "neutral")
    email.urgency_score = sentiment_result.get("urgency_score", 5)

    # 2. Dark Patterns Detection
    dark_patterns_result = detect_dark_patterns(email.subject, email.body)
    email.has_dark_patterns = dark_patterns_result.get("has_dark_patterns", False)
    email.dark_patterns = json.dumps(dark_patterns_result.get("patterns_found", []))  # Store as JSON string
    email.dark_pattern_severity = dark_patterns_result.get("severity", "low")

    # 3. Categorization
    cat_prompt = db.query(Prompt).filter(Prompt.prompt_type == "categorization").first()
    if cat_prompt:
        prompt_text = cat_prompt.template.replace("{subject}", email.subject).replace("{body}", email.body)
        category = llm_service.generate_text(prompt_text).strip()
        # Simple cleanup if LLM is chatty
        if ":" in category: category = category.split(":")[-1].strip()
        email.category = category

    # 4. Action Extraction
    ext_prompt = db.query(Prompt).filter(Prompt.prompt_type == "extraction").first()
    if ext_prompt:
        prompt_text = ext_prompt.template.replace("{body}", email.body)
        response = llm_service.generate_text(prompt_text)
        try:
            # Try to find JSON in response
            start = response.find("[")
            end = response.rfind("]") + 1
            if start != -1 and end != -1:
                json_str = response[start:end]
                actions = json.loads(json_str)
                for action in actions:
                    db_action = ActionItem(
                        email_id=email.id,
                        description=action.get("description", "Unknown task"),
                        deadline=action.get("deadline")
                    )
                    db.add(db_action)
        except Exception as e:
            print(f"Failed to parse actions: {e}")

    # 5. Follow-up Extraction
    followups = extract_followups(email.subject, email.body, email.sender)
    for followup in followups:
        db_followup = FollowUp(
            email_id=email.id,
            commitment=followup.get("commitment", ""),
            committed_by=followup.get("committed_by", email.sender),
            due_date=followup.get("due_date")
        )
        db.add(db_followup)

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
        # First, ensure we have indexed emails. In a real app, this would be done async on ingestion.
        if not rag_service.embeddings:
            all_emails = db.query(Email).all()
            rag_service.index_emails(all_emails)
        
        relevant_emails = rag_service.search(query)
        
        # Fallback: If RAG returns nothing (or query is generic "summarize"), fetch recent emails
        if not relevant_emails or "summarize" in query.lower():
            # Get recent emails if RAG failed or for summary queries
            relevant_emails = db.query(Email).order_by(Email.timestamp.desc()).limit(10).all()
        
        if relevant_emails:
            context = "Here are the most relevant/recent emails found in the inbox:\n\n"
            for e in relevant_emails:
                context += f"ID: {e.id}\nSender: {e.sender}\nSubject: {e.subject}\nDate: {e.timestamp}\nBody: {e.body[:300]}...\nCategory: {e.category}\n\n"
            context += "End of relevant emails.\n\n"

    prompt = f"You are a helpful Email Productivity Agent. You have access to the user's emails provided in the context below.\n\nIMPORTANT: Do not use excessive asterisks (*) for formatting. Use clean, professional formatting with headers and simple lists.\n\n{context}User Query: {query}\n\nAgent Response:"
    return llm_service.generate_text(prompt)
