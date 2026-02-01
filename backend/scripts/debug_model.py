import joblib
import os

MODEL_PATH = "c:/Users/vaish/eboxai/email-agent/backend/data/email_classifier.joblib"

print(f"Loading model from {MODEL_PATH}...")
try:
    clf = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
    
    test_cases = [
        ("Urgent: Q4 Report Due", "Hi, I need the Q4 report by EOD tomorrow. Please make sure it includes the sales figures."),
        ("Tech Weekly: AI is taking over", "This week in tech: AI agents are the new hotness. Read more..."),
        ("[GitHub] Security Alert", "We found a potential security vulnerability in your repository."),
        ("New Job Opportunity", "Hi, We have a great opportunity for a Senior Engineer at Google."),
        ("Dinner on Sunday?", "Hi honey, are you coming over for dinner this Sunday? Love, Mom"),
        ("You won a cruise!", "Click here to claim your prize.")
    ]
    
    print("\n--- Model Predictions ---")
    for subject, body in test_cases:
        text = f"Subject: {subject}. Body: {body}"
        try:
            prediction = clf.predict([text])[0]
            # Try to get probability if supported
            try:
                proba = clf.predict_proba([text])[0]
                max_prob = max(proba)
            except:
                max_prob = "N/A"
                
            print(f"Subject: {subject[:30]}...")
            print(f"Prediction: {prediction} (Conf: {max_prob})")
            print("-" * 30)
        except Exception as e:
            print(f"Error predicting for '{subject}': {e}")

except Exception as e:
    print(f"Failed to load model: {e}")
