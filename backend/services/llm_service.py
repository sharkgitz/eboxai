import os
import json
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
            self.model = genai.GenerativeModel('gemini-2.5-flash')
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
            print(f"LLM Error: {e}")
            debug_info = f"Error: {str(e)}"
            
            # Diagnostic: Check library version
            try:
                import google.generativeai as genai_lib
                debug_info += f" | Lib: {genai_lib.__version__}"
            except:
                pass

            # Diagnostic: List available models
            try:
                models = [m.name for m in genai.list_models()]
                debug_info += f" | Available Models: {', '.join(models)[:200]}..." # Truncate
            except Exception as list_err:
                debug_info += f" | ListModels Failed: {str(list_err)}"

            print(f"LLM Failed. Falling back to mock. Debug: {debug_info}")
            return self._mock_response(safe_prompt)

    def _mock_response(self, prompt: str) -> str:
        # Simple heuristic mock responses for demo

        if "Analyze this email" in prompt or "Categorize" in prompt:
            # Return valid JSON for the comprehensive analysis prompt
            category = "Work: Routine"
            reasoning = "Mock analysis: Content appears to be a standard work email."
            urgency = 3
            sentiment = "neutral"
            
            p_lower = prompt.lower()
            
            if "urgent" in p_lower or "asap" in p_lower:
                category = "Work: Important"
                reasoning = "Mock analysis: Detected urgency keywords."
                urgency = 9
                sentiment = "tense"
            elif "newsletter" in p_lower or "digest" in p_lower or "weekly" in p_lower:
                category = "Newsletter"
                reasoning = "Mock analysis: Appears to be a periodical."
            elif "invoice" in p_lower or "receipt" in p_lower or "payment" in p_lower:
                category = "Finance"
                reasoning = "Mock analysis: Transactional keywords detected."
            elif "flight" in p_lower or "hotel" in p_lower or "booking" in p_lower:
                category = "Travel"
                reasoning = "Mock analysis: Travel confirmation detected."
                sentiment = "happy"
            elif "verify" in p_lower or "lottery" in p_lower or "winner" in p_lower:
                category = "Spam"
                reasoning = "Mock analysis: Suspicious keywords."
                sentiment = "negative"

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
