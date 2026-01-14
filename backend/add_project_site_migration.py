import sqlite3

def migrate():
    db_path = "/Users/philipcowcer/project1/gemini/resource_manager/backend/resource_manager.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(projects)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'project_site' not in columns:
            print("Adding project_site column to projects table...")
            cursor.execute("ALTER TABLE projects ADD COLUMN project_site TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column project_site already exists.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
