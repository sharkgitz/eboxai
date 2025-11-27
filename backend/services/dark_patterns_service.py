"""
Dark Patterns Detector
Identifies manipulative email tactics like fake urgency, hidden unsubscribe, etc.
"""

import re

def detect_dark_patterns(subject: str, body: str) -> dict:
    """
    Detect manipulative patterns in emails.
    Returns: {
        "has_dark_patterns": bool,
        "patterns_found": list of pattern names,
        "severity": "low" | "medium" | "high",
        "warnings": list of human-readable warnings
    }
    """
    patterns_found = []
    warnings = []
    
    # Pattern 1: Fake Urgency
    urgency_keywords = [
        r'\b(urgent|immediately|asap|act now|limited time|expires|hurry|last chance)\b',
        r'\b(only \d+ (left|remaining))\b',
        r'\b(don\'t miss out|final (notice|warning))\b'
    ]
    for pattern in urgency_keywords:
        if re.search(pattern, subject + " " + body, re.IGNORECASE):
            patterns_found.append("fake_urgency")
            warnings.append("⚠️ Contains artificial urgency language")
            break
    
    # Pattern 2: Excessive Capitalization
    if re.search(r'[A-Z]{5,}', subject):
        patterns_found.append("excessive_caps")
        warnings.append("📢 Excessive capitalization in subject")
    
    # Pattern 3: Too Many Exclamation Marks
    if subject.count('!') >= 3 or body.count('!') >= 5:
        patterns_found.append("excessive_exclamation")
        warnings.append("❗ Excessive exclamation marks")
    
    # Pattern 4: Suspicious Links
    suspicious_domains = [r'bit\.ly', r'tinyurl', r't\.co', r'goo\.gl']
    for domain in suspicious_domains:
        if re.search(domain, body, re.IGNORECASE):
            patterns_found.append("shortened_links")
            warnings.append("🔗 Contains shortened/suspicious links")
            break
    
    # Pattern 5: Prize/Winner Language
    prize_keywords = [
        r'\b(you\'?ve? won|congratulations|winner|prize|claim|free)\b',
        r'\b(click here to claim|verify your account)\b'
    ]
    for pattern in prize_keywords:
        if re.search(pattern, subject + " " + body, re.IGNORECASE):
            patterns_found.append("prize_scam")
            warnings.append("🎁 Suspicious prize/winner language")
            break
    
    # Pattern 6: Pressure Tactics
    pressure_keywords = [
        r'\b(your account will be (closed|suspended|deleted))\b',
        r'\b(verify (now|immediately)|confirm your identity)\b',
        r'\b(unusual activity detected)\b'
    ]
    for pattern in pressure_keywords:
        if re.search(pattern, body, re.IGNORECASE):
            patterns_found.append("pressure_tactics")
            warnings.append("⚡ Uses pressure/fear tactics")
            break
    
    # Pattern 7: Hidden Unsubscribe
    if 'unsubscribe' in body.lower():
        # Check if unsubscribe is in tiny text or at very end
        unsubscribe_pos = body.lower().rfind('unsubscribe')
        if unsubscribe_pos > len(body) * 0.9:  # In last 10% of email
            patterns_found.append("hidden_unsubscribe")
            warnings.append("👁️ Unsubscribe link buried at bottom")
    
    # Determine severity
    severity = "low"
    if len(patterns_found) >= 3:
        severity = "high"
    elif len(patterns_found) >= 2:
        severity = "medium"
    
    return {
        "has_dark_patterns": len(patterns_found) > 0,
        "patterns_found": list(set(patterns_found)),  # Remove duplicates
        "severity": severity,
        "warnings": warnings
    }
