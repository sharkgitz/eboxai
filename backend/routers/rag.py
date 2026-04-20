"""
RAG Router - Semantic search API endpoints
==========================================
Provides client-facing endpoints for RAG functionality.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.rag_service import rag_service
from backend.models import Email
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/rag", tags=["RAG"])


class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    category: Optional[str] = None


class IndexResponse(BaseModel):
    success: bool
    indexed_count: int
    message: str


@router.get("/status")
def get_rag_status():
    """
    Get RAG service status including Pinecone connection and vector count.
    Useful for debugging and monitoring.
    """
    return rag_service.get_status()


@router.post("/search")
def semantic_search(request: SearchRequest):
    """
    Semantic search over all indexed emails.
    Returns the most relevant emails based on natural language query.
    
    Example queries:
    - "emails about project deadlines"
    - "messages from John about budget"
    - "urgent client requests"
    """
    filter_dict = None
    if request.category:
        filter_dict = {"category": {"$eq": request.category}}
    
    results = rag_service.search(
        query=request.query,
        k=request.limit,
        filter_dict=filter_dict
    )
    
    return {
        "query": request.query,
        "count": len(results),
        "results": results
    }


@router.get("/search/sender/{sender_email}")
def search_by_sender(sender_email: str, limit: int = Query(10, ge=1, le=50)):
    """Find all emails from a specific sender."""
    results = rag_service.search_by_sender(sender_email, k=limit)
    return {"sender": sender_email, "count": len(results), "results": results}


@router.get("/search/category/{category}")
def search_by_category(category: str, limit: int = Query(10, ge=1, le=50)):
    """Find emails in a specific category."""
    results = rag_service.search_by_category(category, k=limit)
    return {"category": category, "count": len(results), "results": results}


@router.get("/related/{email_id}")
def find_related_emails(email_id: str, limit: int = Query(5, ge=1, le=20)):
    """Find emails similar to a given email."""
    results = rag_service.find_related(email_id, k=limit)
    return {"email_id": email_id, "count": len(results), "related": results}


@router.post("/index")
def index_all_emails(db: Session = Depends(get_db)):
    """
    Index all emails in the database to Pinecone.
    Call this after loading new emails or to rebuild the index.
    """
    emails = db.query(Email).all()
    
    if not emails:
        return IndexResponse(success=False, indexed_count=0, message="No emails found in database")
    
    count = rag_service.index_emails(emails)
    
    return IndexResponse(
        success=count > 0,
        indexed_count=count,
        message=f"Successfully indexed {count} emails" if count > 0 else "Indexing failed (check RAG status)"
    )


@router.delete("/index")
def clear_index():
    """Clear all vectors from the Pinecone index. Use with caution!"""
    success = rag_service.clear_index()
    return {"success": success, "message": "Index cleared" if success else "Failed to clear index"}
