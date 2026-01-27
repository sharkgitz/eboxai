import os
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

            return f"I am a mock agent. (Real Intelligence Failed: {debug_info})"

    def _mock_response(self, prompt: str) -> str:
        # Simple heuristic mock responses for demo
        # Simple heuristic mock responses for demo
        if "Analyze this email" in prompt or "Categorize" in prompt:
            # Return valid JSON for the comprehensive analysis prompt
            return '''{
                "category": "Work: Routine",
                "category_reasoning": "Mock analysis: Content appears to be a standard work email.",
                "sentiment": "neutral",
                "emotion": "neutral",
                "urgency_score": 3,
                "action_items": [],
                "followups": []
            }'''
        
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
