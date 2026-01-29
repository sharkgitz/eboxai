import os
import time
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from backend.models import Email

# Lazy import to avoid crash if pinecone is not installed
try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    print("Pinecone not available. RAG will run in mock mode.")
    PINECONE_AVAILABLE = False

class RAGService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = "eboxai-memory"
        
        self.is_mock = not self.api_key or not self.pinecone_api_key or not PINECONE_AVAILABLE
        
        # Configure Gemini
        if self.api_key:
            genai.configure(api_key=self.api_key)

        # Configure Pinecone
        self.pc = None
        self.index = None
        
        if self.pinecone_api_key:
            try:
                self.pc = Pinecone(api_key=self.pinecone_api_key)
                # Check if index exists
                existing_indexes = [i.name for i in self.pc.list_indexes()]
                
                if self.index_name not in existing_indexes:
                    print(f"Pinecone index '{self.index_name}' not found. Creating...")
                    self.pc.create_index(
                        name=self.index_name,
                        dimension=768, # Gemini embedding dimension
                        metric='cosine',
                        spec=ServerlessSpec(
                            cloud='aws',
                            region='us-east-1'
                        )
                    )
                    # Wait for index to be ready
                    while not self.pc.describe_index(self.index_name).status['ready']:
                        time.sleep(1)
                
                self.index = self.pc.Index(self.index_name)
                print(f"Connected to Pinecone Index: {self.index_name}")
            except Exception as e:
                print(f"Pinecone connection error: {e}")
                self.is_mock = True

    def generate_embedding(self, text: str) -> List[float]:
        # Mock Fallback
        if not self.api_key:
            # Return random vector for mock
            return np.random.rand(768).tolist()
        
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",
                title="Email Embedding"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return np.random.rand(768).tolist()

    def index_emails(self, emails: List[Email]):
        """
        Generates and upserts embeddings to Pinecone with metadata.
        """
        if self.is_mock and not self.index:
            print("RAG Service in MOCK mode (Missing Keys). Skipping Pinecone indexing.")
            return

        print(f"Indexing {len(emails)} emails to Pinecone...")
        vectors = []
        
        for email in emails:
            # Combine subject and body for embedding
            content = f"Subject: {email.subject}\n\n{email.body}"
            embedding = self.generate_embedding(content)
            
            # Extract Graph Entity Data
            entity_data = entity_service.extract_entity_metadata(email)
            
            # Metadata for filtering/context
            metadata = {
                "sender": email.sender,
                "subject": email.subject,
                "timestamp": str(email.timestamp),
                "category": email.category or "Uncategorized",
                "body_snippet": email.body[:1000],
                # Graph Data
                "sender_name": entity_data.get("name", ""),
                "sender_role": entity_data.get("role", ""),
                "sender_company": entity_data.get("company", ""),
                "tone": entity_data.get("tone", "")
            }
            
            vectors.append({
                "id": email.id,
                "values": embedding,
                "metadata": metadata
            })
            
            # Batch upsert (Pinecone limit is usually 100)
            if len(vectors) >= 50:
                self.index.upsert(vectors=vectors)
                vectors = []

        if vectors:
            self.index.upsert(vectors=vectors)
            
        print("Indexing complete.")

    def search(self, query: str, k: int = 5, filter_dict: Dict = None) -> List[Dict]:
        """
        Finds the top-k most relevant emails for a query.
        Returns list of metadata dicts.
        """
        if self.is_mock or not self.index:
            print("Returning Mock Search Results")
            return [] # In a real app we might fallback to SQL match here
            
        try:
            # Generate query embedding
            if self.api_key:
                 query_embedding = genai.embed_content(
                    model="models/embedding-001",
                    content=query,
                    task_type="retrieval_query"
                )['embedding']
            else:
                query_embedding = np.random.rand(768).tolist()

            # Query Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=k,
                include_metadata=True,
                filter=filter_dict # Allow filtering by sender, etc.
            )
            
            return [match['metadata'] for match in results['matches']]

        except Exception as e:
            print(f"Search error: {e}")
            return []

rag_service = RAGService()
