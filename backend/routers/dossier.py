from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Email
from backend.services.rag_service import rag_service
from backend.services.entity_service import entity_service

router = APIRouter(prefix="/dossier", tags=["dossier"])

@router.get("/{email_id}")
def get_dossier(email_id: str, db: Session = Depends(get_db)):
    # 1. Get the current email context
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    # 2. Extract Identity (Live extraction or fetch from RAG metadata if indexed)
    # We do a live extraction to be safe/fresh
    identity = entity_service.extract_entity_metadata(email)

    # 3. Fetch History via RAG (Pinecone)
    # Search for emails from this specific sender
    history_docs = rag_service.search(
        query=f"Emails from {email.sender}", 
        k=5, 
        filter_dict={"sender": {"$eq": email.sender}}
    )

    # 4. Synthesize "Memory Lane"
    # Convert RAG docs into a summary timeline
    history_summary = []
    for doc in history_docs:
        # Skip the current email itself if it comes up
        if doc.get("subject") == email.subject:
            continue
            
        history_summary.append({
            "date": doc.get("timestamp", "Recently"),
            "subject": doc.get("subject", "No Subject"),
            "snippet": doc.get("body_snippet", "")[:100],
            "tone": doc.get("tone", "Neutral")
        })

    return {
        "identity": {
            "name": identity.get("name"),
            "role": identity.get("role"),
            "company": identity.get("company"),
            "email": email.sender
        },
        "sentiment": {
            "current": identity.get("tone"),
            "trend": "Neutral" # Placeholder for now, could aggregate history tones
        },
        "history": history_summary
    }
