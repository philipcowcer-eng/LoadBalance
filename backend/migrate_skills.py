import sqlite3
import os

def migrate():
    # Connect to DB in the same folder as this script
    db_path = os.path.join(os.path.dirname(__file__), 'resource_manager.db')
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Attempting to add 'skills' column to 'engineers' table...")
        cursor.execute("ALTER TABLE engineers ADD COLUMN skills TEXT DEFAULT '[]'")
        conn.commit()
        print("Success: 'skills' column added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Info: 'skills' column already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
