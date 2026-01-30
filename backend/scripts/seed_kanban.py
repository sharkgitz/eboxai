
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = "C:\\Users\\vaish\\eboxai\\email-agent\\backend\\email_agent_v2.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ActionItem(Base):
    __tablename__ = "action_items"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, index=True) # Assuming ForeignKey constraint exists in schema but loose here
    description = Column(String)
    deadline = Column(String, nullable=True)
    status = Column(String, default="pending")

def seed_kanban():
    db = SessionLocal()
    try:
        # Add item 1
        item1 = ActionItem(
            email_id="msg_001",
            description="Compile sales figures for Q4 Report",
            deadline="Tomorrow 5 PM",
            status="pending"
        )
        db.add(item1)
        
        # Add item 2
        item2 = ActionItem(
            email_id="msg_005",
            description="Update Jira tickets for Sprint Planning",
            deadline="Mon 10 AM",
            status="pending"
        )
        db.add(item2)
        
        # Add item 3 (Done)
        item3 = ActionItem(
            email_id="msg_002",
            description="Read AI Agents article",
            status="completed"
        )
        db.add(item3)

        db.commit()
        print("Seeded 3 Action Items.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_kanban()
