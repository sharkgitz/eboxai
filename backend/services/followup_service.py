from backend.services.llm_service import llm_service

def extract_followups(subject: str, body: str, sender: str) -> list:
    """
    Extract commitments and follow-up items from email content.
    Returns list of: {
        "commitment": str,
        "committed_by": "me" | sender_email,
        "due_date": str | None
    }
    """
    prompt = f"""Analyze this email and extract any commitments or promises made.

Subject: {subject}
From: {sender}
Body: {body}

Identify:
1. Commitments I made (things I promised to do)
2. Commitments the sender made (things they promised to do)

For each commitment, extract:
- commitment: what needs to be done
- committed_by: "me" (if I made the promise) or the sender's email
- due_date: when it's due (extract from text, or null if not specified)

Respond ONLY with a JSON array, no other text. Example:
[
  {{"commitment": "Send Q4 report", "committed_by": "me", "due_date": "Friday"}},
  {{"commitment": "Review proposal", "committed_by": "{sender}", "due_date": null}}
]

If no commitments found, return empty array: []
"""

    try:
        response = llm_service.generate_text(prompt)
        import json
        import re
        
        text = response.strip()
        
        # Strip markdown code fences (```json ... ``` or ``` ... ```)
        fence_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
        if fence_match:
            text = fence_match.group(1).strip()
        
        # Try direct parse first
        try:
            result = json.loads(text)
            return result if isinstance(result, list) else []
        except (json.JSONDecodeError, ValueError):
            pass
        
        # Find outermost [ ... ] pair
        first_bracket = text.find('[')
        last_bracket = text.rfind(']')
        if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
            try:
                followups = json.loads(text[first_bracket:last_bracket + 1])
                return followups if isinstance(followups, list) else []
            except (json.JSONDecodeError, ValueError):
                pass
        
        return []
    except Exception as e:
        print(f"Follow-up extraction error: {e}")
        return []

