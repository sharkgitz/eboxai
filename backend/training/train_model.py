import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
import random

# 1. Generate Synthetic Dataset
def generate_dataset(n_samples=200):
    data = []
    
    # Work Emails
    work_keywords = ["meeting", "project", "deadline", "report", "sync", "quarterly review", "status update", "client", "deliverable"]
    for _ in range(n_samples // 4):
        data.append({
            "text": f"Subject: {random.choice(work_keywords)} needed. Body: Please review the attached document by EOD.",
            "label": "Work"
        })
        
    # Finance Emails
    finance_keywords = ["invoice", "payment", "receipt", "salary", "expense", "budget", "tax", "wire transfer"]
    for _ in range(n_samples // 4):
        data.append({
            "text": f"Subject: Your {random.choice(finance_keywords)} is ready. Body: Amount of $500 has been processed.",
            "label": "Finance"
        })
        
    # Travel Emails
    travel_keywords = ["flight", "hotel", "itinerary", "booking", "reservation", "gate change", "boarding pass"]
    for _ in range(n_samples // 4):
        data.append({
            "text": f"Subject: {random.choice(travel_keywords)} confirmation. Body: Your trip to NYC is confirmed.",
            "label": "Travel"
        })
        
    # Spam Emails
    spam_keywords = ["lottery", "winner", "prize", "inheritance", "viagra", "casino", "free money", "urgent business proposal"]
    for _ in range(n_samples // 4):
        data.append({
            "text": f"Subject: You are a {random.choice(spam_keywords)}! Body: Click here to claim your reward immediately.",
            "label": "Spam"
        })
    
    # --- HELPER FUNCTIONS FOR CONSISTENCY ---
    # We use functions to ensure the text structure is IDENTICAL for both clean and noisy data.
    def get_work_text():
        return f"Subject: {random.choice(work_keywords)} needed. Body: Review attached document."
    def get_finance_text():
        return f"Subject: {random.choice(finance_keywords)} processed. Body: Payment sent."
    def get_travel_text():
        return f"Subject: {random.choice(travel_keywords)} confirmed. Body: Trip details attached."
    def get_spam_text():
        return f"Subject: {random.choice(spam_keywords)} alert. Body: Click this link now."

    # --- 1. Clean Data (95% of data) ---
    for _ in range(int(n_samples * 0.95) // 4):
        data.append({"text": get_work_text(), "label": "Work"})
        data.append({"text": get_finance_text(), "label": "Finance"})
        data.append({"text": get_travel_text(), "label": "Travel"})
        data.append({"text": get_spam_text(), "label": "Spam"})

    # ---------------------------------------------------------
    # 2. HUMAN ERROR (Label Noise) - 5%
    # ---------------------------------------------------------
    # We iterate and intentionally assign WRONG labels to the EXACT SAME text structures generated above.
    # This creates inevitable confusion.
    
    # Spam emails mislabeled as Work
    for _ in range(int(n_samples * 0.025)):
        data.append({"text": get_spam_text(), "label": "Work"}) # <-- The text is SPAM, but label is WORK
        
    # Travel emails mislabeled as Finance
    for _ in range(int(n_samples * 0.025)):
        data.append({"text": get_travel_text(), "label": "Finance"}) # <-- The text is TRAVEL, but label is FINANCE

    return pd.DataFrame(data)

# 2. Train Model
def train_and_evaluate():
    print("Generating synthetic dataset...")
    df = generate_dataset(300)
    
    X = df['text']
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training TF-IDF + SGD Classifier...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english')),
        ('clf', SGDClassifier(loss='hinge', penalty='l2', alpha=1e-3, random_state=42, max_iter=5, tol=None)),
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    
    # 3. Metrics
    print("\n--- Model Evaluation ---")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # 4. Save Artifacts
    if not os.path.exists("../data"):
        os.makedirs("../data")
        
    model_path = "../data/email_classifier.joblib"
    joblib.dump(pipeline, model_path)
    print(f"Model saved to: {model_path}")
    
    # 5. Generate Confusion Matrix Plot
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=pipeline.classes_, yticklabels=pipeline.classes_)
    plt.title('Custom Model Confusion Matrix')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.tight_layout()
    plt.savefig('metrics.png')
    print("Metrics plot saved to: backend/training/metrics.png")

if __name__ == "__main__":
    train_and_evaluate()
