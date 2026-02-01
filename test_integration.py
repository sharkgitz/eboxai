from backend.services.inbox_service import predict_category, EMAIL_CLASSIFIER

print(f"Model Loaded: {EMAIL_CLASSIFIER is not None}")
if EMAIL_CLASSIFIER:
    print(f"Model Classes: {EMAIL_CLASSIFIER.classes_}")

test_subjects = [
    "Urgent: Project Deadline",
    "Invoice #1234 from AWS",
    "Flight confirmation to London",
    "You have won a lottery!"
]

print("\n--- Testing Predictions ---")
for subject in test_subjects:
    pred = predict_category(subject, "Please find attached.")
    print(f"Subject: '{subject}' -> Prediction: {pred}")
