import json
from backend.services.llm_service import llm_service
from backend.models import Email

class EntityService:
    """
    Extracts structured entities (Graph Nodes) from emails.
    Identity (Who), Topic (What), Tone (Sentiment).
    """

    def extract_entity_metadata(self, email: Email) -> dict:
        prompt = f"""
        Analyze this email and extract structured entity data for a knowledge graph.
        
        From: {email.sender}
        Subject: {email.subject}
        Body: {email.body}
        
        Return a JSON object with:
        {{
            "name": "Sender's full name (if inferable, else email prefix)",
            "role": "Sender's suspected role (e.g. Recruiter, Boss, Client)",
            "company": "Sender's organization",
            "topic": "Main topic (2-3 words)",
            "tone": "Formal | Casual | Urgent | Angry"
        }}
        """
        
        response = llm_service.generate_text(prompt, json_mode=True)
        try:
            data = json.loads(response)
            return data
        except:
            # Fallback
            return {
                "name": email.sender.split('@')[0],
                "role": "Unknown",
                "company": "Unknown",
                "topic": "General",
                "tone": "Neutral"
            }

entity_service = EntityService()
