from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import engine, Base, get_db, SessionLocal
from backend import models  # Explicit import to ensure models are registered
from backend.routers import inbox, prompts, agent, action_items, playground, followups, meetings, dossier

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Email Productivity Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inbox.router)
app.include_router(prompts.router)
app.include_router(agent.router)
app.include_router(action_items.router)
app.include_router(playground.router)
app.include_router(followups.router)
app.include_router(meetings.router)
app.include_router(dossier.router)

from backend.services import inbox_service

@app.get("/")
async def root():
    return {"message": "Email Agent API is running"}

@app.get("/status")
async def status():
    """Returns the current status of AI services for debugging."""
    from backend.services.llm_service import llm_service
    from backend.services.rag_service import rag_service
    
    return {
        "llm": {
            "mode": "MOCK" if llm_service.is_mock else "REAL (Gemini)",
            "key_present": bool(llm_service.api_key)
        },
        "rag": {
            "mode": "MOCK" if rag_service.is_mock else "REAL (Pinecone)",
            "pinecone_connected": rag_service.index is not None
        }
    }

@app.on_event("startup")
def startup_event():
    """
    Auto-seed database on startup.
    Crucial for ephemeral environments (Vercel/Render) where DB might be wiped.
    """
    db = SessionLocal()
    try:
        inbox_service.load_mock_data(db)
        print("Database auto-seeded on startup.")
    except Exception as e:
        print(f"Auto-seed failed: {e}")
    finally:
        db.close()

@app.post("/seed")
def seed_db(db: Session = Depends(get_db)):
    """
    Seeds the database with mock data.
    Useful for Vercel/Render deployments where DB starts empty.
    """
    try:
        inbox_service.load_mock_data(db)
        return {"message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
