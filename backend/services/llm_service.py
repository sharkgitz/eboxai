import os
import json
import re
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
except Exception as e:
    print(f"Env loading error: {e}")

from backend.services.pii_service import pii_service

class LLMService:
    def __init__(self):
        # Priority: Groq (unlimited) > Gemini (fallback)
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        self.provider = None
        self.is_mock = True
        
        # Try Groq first (better free tier: 30 req/min, no daily limit)
        if self.groq_key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=self.groq_key)
                self.provider = "groq"
                self.is_mock = False
                print("LLM Provider: Groq (Llama 3.3 70B)")
            except ImportError:
                print("Groq package not installed, trying Gemini...")
        
        # Fallback to Gemini
        if not self.provider and self.gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-lite')
                self.provider = "gemini"
                self.is_mock = False
                print("LLM Provider: Gemini (2.0-flash-lite)")
            except Exception as e:
                print(f"Gemini init error: {e}")
        
        if self.is_mock:
            print("Warning: No LLM API keys found. Using Mock LLM.")
    
    # For /status endpoint compatibility
    @property
    def api_key(self):
        return self.groq_key or self.gemini_key

    def generate_text(self, prompt: str, json_mode: bool = False) -> str:
        # Redact PII from prompt for safety
        safe_prompt = pii_service.redact(prompt)
        
        if self.is_mock:
            return self._mock_response(safe_prompt)
        
        try:
            if self.provider == "groq":
                return self._call_groq(safe_prompt, json_mode)
            elif self.provider == "gemini":
                return self._call_gemini(safe_prompt, json_mode)
        except Exception as e:
            error_msg = str(e)
            print(f"LLM Error ({self.provider}): {error_msg}")
            
            if "rate" in error_msg.lower() or "limit" in error_msg.lower():
                return f"⚠️ Rate Limit: {error_msg}. Please wait and try again."
            else:
                return f"⚠️ LLM Error: {error_msg}"
    
    def _call_groq(self, prompt: str, json_mode: bool) -> str:
        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"} if json_mode else None
        )
        return response.choices[0].message.content
    
    def _call_gemini(self, prompt: str, json_mode: bool) -> str:
        import google.generativeai as genai
        generation_config = {}
        if json_mode:
            generation_config["response_mime_type"] = "application/json"
        
        response = self.gemini_model.generate_content(
            prompt, 
            generation_config=generation_config
        )
        return response.text

    def _mock_response(self, prompt: str) -> str:
        # Simple heuristic mock responses for demo

        if "Analyze this email" in prompt or "Categorize" in prompt:
            subject_match = re.search(r"Subject: (.*)", prompt)
            body_match = re.search(r"Body: (.*?)(\nReturn a single JSON|\n\nReturn)", prompt, re.DOTALL)
            
            subject_text = subject_match.group(1) if subject_match else ""
            body_text = body_match.group(1) if body_match else ""
            
            content_lower = (subject_text + " " + body_text).lower()
            
            category = "Work: Routine"
            reasoning = "Mock analysis: Defaulting to routine work."
            urgency = 3
            sentiment = "neutral"

            if "urgent" in content_lower or "asap" in content_lower or "due" in content_lower:
                category = "Work: Important"
                reasoning = "Mock analysis: Detected urgency keywords."
                urgency = 9
                sentiment = "tense"
            elif "newsletter" in content_lower or "digest" in content_lower:
                category = "Newsletter"
                reasoning = "Mock analysis: Appears to be a periodical."
            elif "invoice" in content_lower or "payment" in content_lower:
                category = "Finance"
                reasoning = "Mock analysis: Transactional keywords."
            elif "flight" in content_lower or "hotel" in content_lower:
                category = "Travel"
                reasoning = "Mock analysis: Travel confirmation."
                sentiment = "happy"
            elif "lottery" in content_lower or "winner" in content_lower:
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
            return "Dear Sender,\n\nThank you for your email. I will get back to you shortly.\n\nBest,\nAgent"
        
        if "extract any commitments" in prompt:
            return '[{"commitment": "Send report", "committed_by": "me", "due_date": "Friday"}]'

        return "I am a mock agent. (Reason: No API keys configured)"

llm_service = LLMService()
