import json
from sqlalchemy.orm import Session
from backend.models import Email, Prompt, ActionItem, Draft
from backend.services.llm_service import llm_service

def process_email(db: Session, email_id: str):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return None

    # 1. Categorization
    cat_prompt = db.query(Prompt).filter(Prompt.prompt_type == "categorization").first()
    if cat_prompt:
        prompt_text = cat_prompt.template.replace("{subject}", email.subject).replace("{body}", email.body)
        category = llm_service.generate_text(prompt_text).strip()
        # Simple cleanup if LLM is chatty
        if ":" in category: category = category.split(":")[-1].strip()
        email.category = category

    # 2. Action Extraction
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

    db.commit()
    return email

def generate_draft(db: Session, email_id: str, instructions: str = None):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return None

    reply_prompt = db.query(Prompt).filter(Prompt.prompt_type == "reply").first()
    if reply_prompt:
        template = reply_prompt.template
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

def chat_agent(db: Session, query: str, email_id: str = None):
    context = ""
    if email_id:
        email = db.query(Email).filter(Email.id == email_id).first()
        if email:
            context = f"Context Email:\nSender: {email.sender}\nSubject: {email.subject}\nBody: {email.body}\n\n"
    else:
        # If no specific email, provide context of recent emails (e.g., last 15)
        recent_emails = db.query(Email).order_by(Email.timestamp.desc()).limit(15).all()
        if recent_emails:
            context = "Here are the recent emails in the user's inbox:\n\n"
            for e in recent_emails:
                context += f"ID: {e.id}\nSender: {e.sender}\nSubject: {e.subject}\nDate: {e.timestamp}\nBody: {e.body[:200]}...\nCategory: {e.category}\n\n"
            context += "End of emails.\n\n"

    prompt = f"You are a helpful Email Productivity Agent. You have access to the user's emails provided in the context below.\n\nIMPORTANT: Do not use excessive asterisks (*) for formatting. Use clean, professional formatting with headers and simple lists.\n\n{context}User Query: {query}\n\nAgent Response:"
    return llm_service.generate_text(prompt)
