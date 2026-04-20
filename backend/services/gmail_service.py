import imaplib
import email
from email.header import decode_header
import os
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import Email
from backend.services.classifier_v2 import predict_category
from backend.logger import get_logger

logger = get_logger(__name__)

def decode_mime_words(s):
    """Helper to decode MIME encoded headers (like subjects with emojis/special chars)"""
    if not s:
        return ""
    try:
        parts = decode_header(s)
        decoded_parts = []
        for content, encoding in parts:
            if isinstance(content, bytes):
                decoded_parts.append(content.decode(encoding or 'utf-8', errors='replace'))
            else:
                decoded_parts.append(content)
        return "".join(decoded_parts)
    except Exception:
        return s

def fetch_emails(db: Session, max_emails: int = 50):
    GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

    if not GMAIL_EMAIL or not GMAIL_APP_PASSWORD:
        logger.error("Gmail credentials missing in environment")
        return {"error": "Gmail credentials missing. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env"}

    try:
        # Connect to Gmail IMAP
        logger.info(f"Connecting to Gmail IMAP for {GMAIL_EMAIL}...")
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
        mail.select("inbox")

        # Search for UNSEEN (unread) emails
        status, messages = mail.search(None, 'UNSEEN')
        if status != 'OK':
            logger.error("Failed to search UNSEEN emails")
            return {"error": "Search failed"}

        mail_ids = messages[0].split()
        if not mail_ids:
            logger.info("No unread emails found")
            return {"message": "No new emails", "count": 0}

        # Process from newest to oldest up to max_emails
        mail_ids = mail_ids[::-1][:max_emails]
        new_emails_count = 0

        for m_id in mail_ids:
            status, data = mail.fetch(m_id, "(RFC822)")
            if status != 'OK':
                continue

            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)

            subject = decode_mime_words(msg.get("Subject", "No Subject"))
            sender = decode_mime_words(msg.get("From", "Unknown Sender"))
            
            # Extract body
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if content_type == "text/plain" and "attachment" not in content_disposition:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode(errors='replace')
                        break
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode(errors='replace')

            # Clean body
            body = " ".join(body.split())[:3000]

            # Use Message-ID or fallback
            msg_id = msg.get("Message-ID")
            if not msg_id:
                # Fallback to a unique string if Message-ID is missing
                msg_id = f"{m_id.decode()}-{GMAIL_EMAIL}-{hash(subject)}"
            
            # Remove angle brackets if present
            msg_id = msg_id.strip("<>")

            # Check if email already exists in DB
            existing = db.query(Email).filter(Email.id == msg_id).first()
            if existing:
                continue

            # Classify
            category, confidence = predict_category(subject, body, sender)

            # Create DB object
            new_email = Email(
                id=msg_id,
                sender=sender,
                subject=subject,
                body=body,
                timestamp=datetime.now(),
                category=category,
                confidence_score=confidence,
                is_read=False,
                urgency_score=9 if any(w in subject.lower() for w in ["urgent", "asap", "priority"]) else 5
            )
            
            db.add(new_email)
            new_emails_count += 1

        db.commit()
        mail.close()
        mail.logout()

        logger.info(f"✅ Successfully synced {new_emails_count} emails from Gmail.")
        return {"message": f"Successfully synced {new_emails_count} emails", "count": new_emails_count}

    except Exception as e:
        logger.error(f"❌ Gmail sync failed: {e}")
        return {"error": str(e)}
