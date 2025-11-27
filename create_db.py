from backend.database import engine, Base
from backend import models
import os
import sys

print(f"sys.path: {sys.path}")
print(f"models file: {models.__file__}")
print(f"Email columns: {[c.name for c in models.Email.__table__.columns]}")

db_path = "email_agent.db"
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Deleted existing {db_path}")

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")

# Verify schema
import sqlite3
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(emails)")
columns = cursor.fetchall()
print("Columns in emails table:")
for col in columns:
    print(col)
conn.close()
