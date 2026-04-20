from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import engine, Base, get_db, SessionLocal
from backend import models
from backend.routers import inbox, prompts, agent, action_items, playground, followups, meetings, dossier, agentic, analytics, rag
from backend.logger import get_logger

logger = get_logger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Modern lifespan handler (replaces deprecated @app.on_event).
    Auto-seeds database on startup for ephemeral environments.
    """
    from backend.services import inbox_service
    db = SessionLocal()
    try:
        inbox_service.load_mock_data(db)
        logger.info("Database auto-seeded on startup.")
    except Exception as e:
        logger.error(f"Auto-seed failed: {e}")
    finally:
        db.close()
    
    yield  # Application runs here
    
    # Shutdown logic (if needed)
    logger.info("Application shutting down.")


app = FastAPI(title="Email Productivity Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(inbox.router)
app.include_router(prompts.router)
app.include_router(agent.router)
app.include_router(action_items.router)
app.include_router(playground.router)
app.include_router(followups.router)
app.include_router(meetings.router)
app.include_router(dossier.router)
app.include_router(agentic.router)
app.include_router(analytics.router)
app.include_router(rag.router)

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
            "mode": "MOCK" if llm_service.is_mock else f"REAL ({llm_service.provider})",
            "provider": llm_service.provider,
            "key_present": bool(llm_service.api_key)
        },
        "rag": rag_service.get_status(),
        "classifier": {
            "model": "classifier_v2",
            "accuracy": "95.97%"
        }
    }


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
