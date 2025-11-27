import sqlite3
import os

db_path = "email_agent.db"
if not os.path.exists(db_path):
    print(f"Database file {db_path} does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(emails)")
        columns = cursor.fetchall()
        print("Columns in emails table:")
        for col in columns:
            print(col)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
