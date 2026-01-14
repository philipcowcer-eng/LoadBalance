import sqlite3

def migrate():
    db_path = "/Users/philipcowcer/project1/gemini/resource_manager/backend/resource_manager.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='resourcing_requirements'")
        if cursor.fetchone():
            print("Table resourcing_requirements already exists.")
            return
        
        print("Creating resourcing_requirements table...")
        cursor.execute("""
            CREATE TABLE resourcing_requirements (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                role TEXT NOT NULL,
                hours_per_week INTEGER NOT NULL,
                duration_weeks INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)
        conn.commit()
        print("Migration successful.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
