from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend import models  # Explicit import to ensure models are registered
from backend.routers import inbox, prompts, agent, action_items, playground, followups, meetings

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

@app.get("/")
async def root():
    return {"message": "Email Agent API is running"}
