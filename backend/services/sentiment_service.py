from backend.services.llm_service import llm_service

def analyze_sentiment(subject: str, body: str) -> dict:
    """
    Analyze the sentiment and emotional tone of an email.
    Returns: {
        "sentiment": "positive" | "negative" | "neutral" | "urgent",
        "emotion": "happy" | "frustrated" | "angry" | "neutral" | "excited",
        "urgency_score": 0-10,
        "confidence": 0.0-1.0
    }
    """
    prompt = f"""Analyze the sentiment and emotional tone of this email.

Subject: {subject}
Body: {body}

Provide a JSON response with:
1. sentiment: one of [positive, negative, neutral, urgent]
2. emotion: one of [happy, frustrated, angry, neutral, excited, worried, professional]
3. urgency_score: 0-10 (how urgent/time-sensitive is this email)
4. confidence: 0.0-1.0 (how confident you are in this analysis)

Respond ONLY with valid JSON, no other text."""

    try:
        response = llm_service.generate_text(prompt)
        # Try to extract JSON from response
        import json
        import re
        
        # Find JSON in response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            # Fallback
            return {
                "sentiment": "neutral",
                "emotion": "neutral",
                "urgency_score": 5,
                "confidence": 0.5
            }
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return {
            "sentiment": "neutral",
            "emotion": "neutral",
            "urgency_score": 5,
            "confidence": 0.3
        }
