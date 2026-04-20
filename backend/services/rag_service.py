"""
RAG Service - Retrieval Augmented Generation for Email Search
==============================================================
Uses Pinecone for vector storage + sentence-transformers for local embeddings.
Provides semantic search over emails for the Agent Chat.
No API keys required for embeddings - runs locally!
"""
import os
import time
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path
from backend.logger import get_logger

logger = get_logger(__name__)

# Lazy import to avoid crash if pinecone is not installed
try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    logger.warning("Pinecone not installed. RAG will run in mock mode.")
    PINECONE_AVAILABLE = False

# Lazy import for local embeddings (sentence-transformers)
SENTENCE_TRANSFORMERS_AVAILABLE = False
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("sentence-transformers not installed. Will try Gemini fallback.")

# Fallback to Gemini if sentence-transformers not available
GENAI_AVAILABLE = False
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    pass


class RAGService:
    """
    Semantic email search using vector embeddings.
    
    Client-Facing Features:
    - Natural language search over all emails
    - Filter by sender, category, date
    - Contextual retrieval for agent chat
    - Automatic indexing of new emails
    
    Embedding Providers (in priority order):
    1. sentence-transformers (local, no API key needed)
    2. Gemini embedding-001 (fallback if API key present)
    3. Mock mode (random vectors for testing)
    """
    
    # Local model: all-MiniLM-L6-v2 - 384 dimensions, fast, good quality
    LOCAL_MODEL_NAME = "all-MiniLM-L6-v2"
    LOCAL_EMBEDDING_DIM = 384
    
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "eboxai-local")  # Different index for 384-dim
        
        self.pc = None
        self.index = None
        self.is_mock = True
        self.connection_error = None
        self.embedding_provider = None
        self.local_model = None
        
        # Initialize embedding model (prefer local)
        self._init_embedding_model()
        
        # Configure Pinecone
        self._connect_pinecone()
    
    def _init_embedding_model(self):
        """Initialize embedding model - prefer local sentence-transformers."""
        # Try local embeddings first (no API key needed!)
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                logger.info(f"Loading local embedding model: {self.LOCAL_MODEL_NAME}...")
                self.local_model = SentenceTransformer(self.LOCAL_MODEL_NAME)
                self.embedding_provider = "local"
                logger.info(f"✅ Local embeddings ready ({self.LOCAL_EMBEDDING_DIM} dimensions)")
                return
            except Exception as e:
                logger.error(f"Failed to load local model: {e}")
        
        # Fallback to Gemini if key present
        if self.gemini_key and GENAI_AVAILABLE:
            try:
                genai.configure(api_key=self.gemini_key)
                self.embedding_provider = "gemini"
                logger.info("Gemini configured for embeddings (fallback)")
                return
            except Exception as e:
                logger.error(f"Gemini config error: {e}")
        
        logger.warning("No embedding provider available. RAG will use mock embeddings.")
    
    def _connect_pinecone(self):
        """Connect to Pinecone and create index if needed."""
        if not self.pinecone_api_key:
            logger.warning("PINECONE_API_KEY not set. RAG in mock mode.")
            self.connection_error = "Missing PINECONE_API_KEY"
            return
        
        if not PINECONE_AVAILABLE:
            self.connection_error = "Pinecone package not installed"
            return
        
        try:
            self.pc = Pinecone(api_key=self.pinecone_api_key)
            
            # Check existing indexes
            existing_indexes = [i.name for i in self.pc.list_indexes()]
            logger.info(f"Existing Pinecone indexes: {existing_indexes}")
            
            if self.index_name not in existing_indexes:
                # Use 384 dimensions for local model, or 768 for Gemini
                dim = self.LOCAL_EMBEDDING_DIM if self.embedding_provider == "local" else 768
                logger.info(f"Creating Pinecone index '{self.index_name}' with {dim} dimensions...")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=dim,
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1'
                    )
                )
                # Wait for ready
                for _ in range(30):
                    status = self.pc.describe_index(self.index_name)
                    if status.status.get('ready', False):
                        break
                    time.sleep(1)
            
            self.index = self.pc.Index(self.index_name)
            self.is_mock = False
            
            # Get index stats
            stats = self.index.describe_index_stats()
            logger.info(f"✅ Connected to Pinecone: {self.index_name} ({stats.total_vector_count} vectors)")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Pinecone connection failed: {error_msg}")
            self.connection_error = error_msg
            self.is_mock = True
    
    def get_status(self) -> Dict[str, Any]:
        """Return RAG service status for debugging/UI."""
        return {
            "mode": "MOCK" if self.is_mock else "REAL (Pinecone)",
            "embedding_provider": self.embedding_provider or "mock",
            "embedding_model": self.LOCAL_MODEL_NAME if self.embedding_provider == "local" else "gemini/embedding-001",
            "pinecone_connected": self.index is not None,
            "index_name": self.index_name,
            "error": self.connection_error,
            "vector_count": self._get_vector_count()
        }
    
    def _get_vector_count(self) -> int:
        """Get number of indexed vectors."""
        if self.is_mock or not self.index:
            return 0
        try:
            stats = self.index.describe_index_stats()
            return stats.total_vector_count
        except:
            return 0
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text using configured provider."""
        # Use local embeddings (preferred - no API key needed)
        if self.embedding_provider == "local" and self.local_model:
            try:
                embedding = self.local_model.encode(text[:8000], convert_to_numpy=True)
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Local embedding error: {e}")
                return np.random.rand(self.LOCAL_EMBEDDING_DIM).tolist()
        
        # Fallback to Gemini
        if self.embedding_provider == "gemini" and GENAI_AVAILABLE:
            try:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text[:8000],
                    task_type="retrieval_document",
                    title="Email Content"
                )
                return result['embedding']
            except Exception as e:
                logger.error(f"Gemini embedding error: {e}")
                return np.random.rand(768).tolist()
        
        # Mock embedding for testing
        dim = self.LOCAL_EMBEDDING_DIM if self.embedding_provider == "local" else 768
        return np.random.rand(dim).tolist()
    
    def index_email(self, email) -> bool:
        """
        Index a single email to Pinecone.
        Called when processing new emails.
        """
        if self.is_mock or not self.index:
            return False
        
        try:
            # Create rich content for embedding
            content = f"From: {email.sender}\nSubject: {email.subject}\n\n{email.body}"
            embedding = self.generate_embedding(content)
            
            # Rich metadata for filtering and context
            metadata = {
                "sender": email.sender or "",
                "subject": email.subject or "",
                "timestamp": str(email.timestamp) if email.timestamp else "",
                "category": email.category or "General",
                "body_snippet": (email.body or "")[:500],
                "is_read": email.is_read if hasattr(email, 'is_read') else False,
                "urgency": email.urgency_score if hasattr(email, 'urgency_score') else 5,
            }
            
            self.index.upsert(vectors=[{
                "id": str(email.id),
                "values": embedding,
                "metadata": metadata
            }])
            
            logger.info(f"Indexed email: {email.id}")
            return True
            
        except Exception as e:
            logger.error(f"Index error for {email.id}: {e}")
            return False
    
    def index_emails(self, emails: list) -> int:
        """
        Batch index multiple emails.
        Returns count of successfully indexed emails.
        """
        if self.is_mock or not self.index:
            logger.warning("RAG in mock mode. Skipping indexing.")
            return 0
        
        logger.info(f"Indexing {len(emails)} emails to Pinecone...")
        vectors = []
        indexed = 0
        
        for email in emails:
            try:
                content = f"From: {email.sender}\nSubject: {email.subject}\n\n{email.body}"
                embedding = self.generate_embedding(content)
                
                metadata = {
                    "sender": email.sender or "",
                    "subject": email.subject or "",
                    "timestamp": str(email.timestamp) if email.timestamp else "",
                    "category": email.category or "General",
                    "body_snippet": (email.body or "")[:500],
                }
                
                vectors.append({
                    "id": str(email.id),
                    "values": embedding,
                    "metadata": metadata
                })
                
                # Batch upsert every 50
                if len(vectors) >= 50:
                    self.index.upsert(vectors=vectors)
                    indexed += len(vectors)
                    vectors = []
                    
            except Exception as e:
                logger.error(f"Error indexing {email.id}: {e}")
        
        # Final batch
        if vectors:
            self.index.upsert(vectors=vectors)
            indexed += len(vectors)
        
        logger.info(f"✅ Indexed {indexed} emails to Pinecone")
        return indexed
    
    def search(self, query: str, k: int = 5, filter_dict: Dict = None) -> List[Dict]:
        """
        Semantic search for relevant emails.
        
        Args:
            query: Natural language search query
            k: Number of results to return
            filter_dict: Optional metadata filters (e.g., {"category": "Work: Important"})
        
        Returns:
            List of email metadata dicts with similarity scores
        """
        if self.is_mock or not self.index:
            logger.info("RAG mock mode - returning empty results")
            return []
        
        try:
            # Generate query embedding using configured provider
            query_embedding = self.generate_embedding(query)
            
            # Query Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=k,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Format results with scores
            formatted = []
            for match in results.get('matches', []):
                result = match.get('metadata', {})
                result['id'] = match.get('id')
                result['score'] = round(match.get('score', 0), 3)
                formatted.append(result)
            
            logger.info(f"RAG search for '{query[:50]}...' returned {len(formatted)} results")
            return formatted
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    def search_by_sender(self, sender_email: str, k: int = 10) -> List[Dict]:
        """Find all emails from a specific sender."""
        return self.search(
            query=f"emails from {sender_email}",
            k=k,
            filter_dict={"sender": {"$eq": sender_email}}
        )
    
    def search_by_category(self, category: str, k: int = 10) -> List[Dict]:
        """Find emails in a specific category."""
        return self.search(
            query=f"{category} emails",
            k=k,
            filter_dict={"category": {"$eq": category}}
        )
    
    def find_related(self, email_id: str, k: int = 5) -> List[Dict]:
        """Find emails similar to a given email."""
        if self.is_mock or not self.index:
            return []
        
        try:
            # Fetch the email's vector
            fetch_result = self.index.fetch(ids=[str(email_id)])
            if email_id not in fetch_result.get('vectors', {}):
                return []
            
            vector = fetch_result['vectors'][email_id]['values']
            
            # Find similar
            results = self.index.query(
                vector=vector,
                top_k=k + 1,  # +1 to exclude self
                include_metadata=True
            )
            
            # Exclude the original email
            return [
                {**m['metadata'], 'id': m['id'], 'score': round(m['score'], 3)}
                for m in results.get('matches', [])
                if m['id'] != email_id
            ][:k]
            
        except Exception as e:
            logger.error(f"Find related error: {e}")
            return []
    
    def delete_email(self, email_id: str) -> bool:
        """Remove an email from the index."""
        if self.is_mock or not self.index:
            return False
        
        try:
            self.index.delete(ids=[str(email_id)])
            return True
        except Exception as e:
            logger.error(f"Delete error: {e}")
            return False
    
    def clear_index(self) -> bool:
        """Clear all vectors from the index. Use with caution!"""
        if self.is_mock or not self.index:
            return False
        
        try:
            self.index.delete(delete_all=True)
            logger.warning("Cleared all vectors from Pinecone index")
            return True
        except Exception as e:
            logger.error(f"Clear index error: {e}")
            return False


# Singleton instance
rag_service = RAGService()
