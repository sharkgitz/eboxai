import re

class PIIService:
    def __init__(self):
        # Regex patterns for sensitive data
        self.patterns = {
            'CREDIT_CARD': r'\b(?:\d[ -]*?){13,16}\b',
            'SSN': r'\b\d{3}-\d{2}-\d{4}\b',
            'PHONE': r'\b(?:\+?1[-.]?)?\s*\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b',
            # We explicitly DO NOT redact email addresses as they are crucial for the agent's context
        }

    def redact(self, text: str) -> str:
        """
        Redacts sensitive information from the text.
        """
        if not text:
            return ""

        redacted_text = text
        for label, pattern in self.patterns.items():
            redacted_text = re.sub(pattern, f'[REDACTED_{label}]', redacted_text)
        
        return redacted_text

pii_service = PIIService()
