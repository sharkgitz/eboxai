import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

print("Loading LLM Service...")
try:
    env_path = Path(__file__).resolve().parent.parent / '.env'
    print(f"Loading .env from: {env_path}")
    
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
                    print(f"Set {key} manually.")
    else:
        print(".env file not found!")

    key = os.getenv("GEMINI_API_KEY")
except Exception as e:
    print(f"Env loading error: {e}")

from backend.services.pii_service import pii_service

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.is_mock = False
        else:
            self.is_mock = True
            print("Warning: GEMINI_API_KEY not found. Using Mock LLM.")

    def generate_text(self, prompt: str, json_mode: bool = False) -> str:
        # Redact PII from prompt for safety
        safe_prompt = pii_service.redact(prompt)
        
        # DEBUG: Log prompt to file
        try:
            with open("debug_prompt.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- PROMPT ---\n{safe_prompt}\n----------------\n")
        except:
            pass
        
        if self.is_mock:
            return self._mock_response(safe_prompt)
        
        try:
            generation_config = {}
            if json_mode:
                generation_config["response_mime_type"] = "application/json"
            
            response = self.model.generate_content(
                safe_prompt, 
                generation_config=generation_config
            )
            return response.text
        except Exception as e:
            error_msg = str(e)
            print(f"LLM Error: {error_msg}")
            
            # Diagnostic: Check for common issues
            if "quota" in error_msg.lower() or "rate" in error_msg.lower():
                return f"⚠️ API Rate Limit Hit: {error_msg}. Please wait and try again."
            elif "model" in error_msg.lower() or "not found" in error_msg.lower():
                return f"⚠️ Model Error: {error_msg}. The AI model may be unavailable."
            elif "key" in error_msg.lower() or "auth" in error_msg.lower():
                return f"⚠️ API Key Error: {error_msg}. Please check your GEMINI_API_KEY."
            else:
                # Return the actual error to help debug
                return f"⚠️ LLM Error: {error_msg}"

    def _mock_response(self, prompt: str) -> str:
        # Simple heuristic mock responses for demo

        if "Analyze this email" in prompt or "Categorize" in prompt:
            # Return valid JSON for the comprehensive analysis prompt
            # Extract content to avoid matching instructions in the prompt
            import re
            subject_match = re.search(r"Subject: (.*)", prompt)
            # Body ends where the instructions begin ("Return a single JSON")
            body_match = re.search(r"Body: (.*?)(\nReturn a single JSON|\n\nReturn)", prompt, re.DOTALL)
            
            subject_text = subject_match.group(1) if subject_match else ""
            body_text = body_match.group(1) if body_match else ""
            
            # Combine relevant text for analysis
            content_lower = (subject_text + " " + body_text).lower()
            
            # Default
            category = "Work: Routine"
            reasoning = "Mock analysis: Defaulting to routine work based on content patterns."
            urgency = 3
            sentiment = "neutral"

            if "urgent" in content_lower or "asap" in content_lower or "due" in content_lower:
                category = "Work: Important"
                reasoning = "Mock analysis: Detected urgency keywords."
                urgency = 9
                sentiment = "tense"
            elif "newsletter" in content_lower or "digest" in content_lower or "weekly" in content_lower:
                category = "Newsletter"
                reasoning = "Mock analysis: Appears to be a periodical."
            elif "invoice" in content_lower or "receipt" in content_lower or "payment" in content_lower or "billing" in content_lower:
                category = "Finance"
                reasoning = "Mock analysis: Transactional keywords detected."
            elif "flight" in content_lower or "hotel" in content_lower or "booking" in content_lower:
                category = "Travel"
                reasoning = "Mock analysis: Travel confirmation detected."
                sentiment = "happy"
            elif "lottery" in content_lower or "winner" in content_lower or "prize" in content_lower:
                category = "Spam"
                reasoning = "Mock analysis: Suspicious keywords."
                sentiment = "negative"
            elif "dinner" in content_lower or "mom" in content_lower or "honey" in content_lower or "weekend" in content_lower:
                category = "Personal"
                reasoning = "Mock analysis: Personal context detected."
                sentiment = "happy"
            elif "github" in content_lower or "pr" in content_lower or "review" in content_lower or "sprint" in content_lower or "meeting" in content_lower:
                category = "Work: Routine" # Specific routine work
                reasoning = "Mock analysis: Work related terms detected."

            return json.dumps({
                "category": category,
                "category_reasoning": reasoning,
                "sentiment": sentiment,
                "emotion": sentiment,
                "urgency_score": urgency,
                "action_items": [],
                "followups": []
            })
        
        if "Extract action items" in prompt:
            return '[{"description": "Review report", "deadline": "tomorrow"}]'
        
        if "Draft a" in prompt:
            return "Dear Sender,\n\nThank you for your email. I have received it and will get back to you shortly.\n\nBest,\nAgent"
        
        if "Analyze this email and extract any commitments" in prompt:
            return '''[
                {"commitment": "Send Q4 report", "committed_by": "me", "due_date": "Friday"},
                {"commitment": "Review proposal", "committed_by": "sender", "due_date": null}
            ]'''

        return "I am a mock agent. (Reason: GEMINI_API_KEY environment variable is missing)"

llm_service = LLMService()
