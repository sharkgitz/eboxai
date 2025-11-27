import os
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Any
from backend.models import Email

class RAGService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.embeddings = {} # email_id -> numpy array
        self.emails = {} # email_id -> Email object
        self.is_mock = not self.api_key

        if self.api_key:
            genai.configure(api_key=self.api_key)

    def generate_embedding(self, text: str) -> np.ndarray:
        if self.is_mock:
            return np.random.rand(768)
        
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",
                title="Email Embedding"
            )
            return np.array(result['embedding'])
        except Exception as e:
            print(f"Embedding error: {e}")
            return np.random.rand(768)

    def index_emails(self, emails: List[Email]):
        """
        Generates and stores embeddings for a list of emails.
        """
        print(f"Indexing {len(emails)} emails...")
        for email in emails:
            # Combine subject and body for embedding
            content = f"Subject: {email.subject}\n\n{email.body}"
            embedding = self.generate_embedding(content)
            self.embeddings[email.id] = embedding
            self.emails[email.id] = email
        print("Indexing complete.")

    def search(self, query: str, k: int = 5) -> List[Email]:
        """
        Finds the top-k most relevant emails for a query.
        """
        if not self.embeddings:
            return []

        if self.is_mock:
            # Simple keyword match fallback
            results = []
            for email in self.emails.values():
                if query.lower() in email.subject.lower() or query.lower() in email.body.lower():
                    results.append(email)
            return results[:k]

        try:
            query_embedding = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query"
            )['embedding']
            query_vec = np.array(query_embedding)

            scores = []
            for email_id, doc_vec in self.embeddings.items():
                # Cosine similarity
                similarity = np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec))
                scores.append((similarity, self.emails[email_id]))

            # Sort by similarity desc
            scores.sort(key=lambda x: x[0], reverse=True)
            return [email for _, email in scores[:k]]

        except Exception as e:
            print(f"Search error: {e}")
            return []

rag_service = RAGService()
