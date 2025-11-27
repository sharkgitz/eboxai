"""
LLM Evaluation Script
Measures the accuracy of the email agent on a labeled test dataset.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.llm_service import llm_service
from backend.services.agent_service import categorize_email, extract_action_items

# Gold standard test dataset
TEST_EMAILS = [
    {
        "subject": "Urgent: Q4 Budget Review Meeting Tomorrow",
        "body": "Please review the attached budget proposal before our meeting at 2 PM tomorrow. We need your approval by EOD.",
        "expected_category": "Important",
        "expected_action_items": ["Review budget proposal", "Attend meeting at 2 PM tomorrow", "Provide approval by EOD"]
    },
    {
        "subject": "Weekly Newsletter - Tech Trends",
        "body": "Check out this week's top stories in AI and machine learning...",
        "expected_category": "Newsletter",
        "expected_action_items": []
    },
    {
        "subject": "Complete your profile to unlock features",
        "body": "You're missing out! Click here to complete your profile and get access to premium features.",
        "expected_category": "Spam",
        "expected_action_items": []
    },
    {
        "subject": "Project Deadline Extension Request",
        "body": "Hi team, due to unforeseen circumstances, I'm requesting a 3-day extension for the Alpha release. Please confirm by Friday.",
        "expected_category": "To-Do",
        "expected_action_items": ["Review extension request", "Confirm decision by Friday"]
    },
]

def evaluate_categorization():
    """Evaluate email categorization accuracy."""
    correct = 0
    total = len(TEST_EMAILS)
    
    print("=" * 60)
    print("EVALUATING EMAIL CATEGORIZATION")
    print("=" * 60)
    
    for i, email in enumerate(TEST_EMAILS, 1):
        predicted_category = categorize_email(email["subject"], email["body"])
        expected_category = email["expected_category"]
        
        is_correct = predicted_category.lower() == expected_category.lower()
        if is_correct:
            correct += 1
        
        status = "✓" if is_correct else "✗"
        print(f"\n{status} Test {i}/{total}")
        print(f"  Subject: {email['subject'][:50]}...")
        print(f"  Expected: {expected_category}")
        print(f"  Predicted: {predicted_category}")
    
    accuracy = (correct / total) * 100
    print(f"\n{'=' * 60}")
    print(f"CATEGORIZATION ACCURACY: {correct}/{total} ({accuracy:.1f}%)")
    print(f"{'=' * 60}\n")
    
    return accuracy

def evaluate_action_items():
    """Evaluate action item extraction."""
    total_precision = 0
    total_recall = 0
    count = 0
    
    print("=" * 60)
    print("EVALUATING ACTION ITEM EXTRACTION")
    print("=" * 60)
    
    for i, email in enumerate(TEST_EMAILS, 1):
        predicted_items = extract_action_items(email["subject"], email["body"])
        expected_items = email["expected_action_items"]
        
        if len(expected_items) == 0 and len(predicted_items) == 0:
            # Both empty, perfect match
            precision = recall = 1.0
        elif len(expected_items) == 0:
            # False positives
            precision = 0.0
            recall = 1.0
        elif len(predicted_items) == 0:
            # False negatives
            precision = 1.0
            recall = 0.0
        else:
            # Calculate overlap (simple string matching)
            matches = sum(1 for p in predicted_items if any(e.lower() in p["description"].lower() or p["description"].lower() in e.lower() for e in expected_items))
            precision = matches / len(predicted_items) if predicted_items else 0
            recall = matches / len(expected_items) if expected_items else 0
        
        total_precision += precision
        total_recall += recall
        count += 1
        
        print(f"\nTest {i}/{len(TEST_EMAILS)}")
        print(f"  Subject: {email['subject'][:50]}...")
        print(f"  Expected: {len(expected_items)} items")
        print(f"  Predicted: {len(predicted_items)} items")
        print(f"  Precision: {precision:.2f}, Recall: {recall:.2f}")
    
    avg_precision = (total_precision / count) * 100
    avg_recall = (total_recall / count) * 100
    f1_score = 2 * (avg_precision * avg_recall) / (avg_precision + avg_recall) if (avg_precision + avg_recall) > 0 else 0
    
    print(f"\n{'=' * 60}")
    print(f"ACTION ITEM EXTRACTION METRICS:")
    print(f"  Precision: {avg_precision:.1f}%")
    print(f"  Recall: {avg_recall:.1f}%")
    print(f"  F1 Score: {f1_score:.1f}%")
    print(f"{'=' * 60}\n")
    
    return f1_score

def main():
    print("\n" + "=" * 60)
    print("EMAIL AGENT EVALUATION SUITE")
    print("=" * 60 + "\n")
    
    cat_accuracy = evaluate_categorization()
    action_f1 = evaluate_action_items()
    
    overall_score = (cat_accuracy + action_f1) / 2
    
    print("=" * 60)
    print("OVERALL EVALUATION SCORE")
    print("=" * 60)
    print(f"Categorization Accuracy: {cat_accuracy:.1f}%")
    print(f"Action Item F1 Score: {action_f1:.1f}%")
    print(f"Overall Score: {overall_score:.1f}%")
    print("=" * 60)
    
    # Determine grade
    if overall_score >= 90:
        grade = "A (Excellent)"
    elif overall_score >= 80:
        grade = "B (Good)"
    elif overall_score >= 70:
        grade = "C (Acceptable)"
    else:
        grade = "D (Needs Improvement)"
    
    print(f"\nGrade: {grade}\n")

if __name__ == "__main__":
    main()
