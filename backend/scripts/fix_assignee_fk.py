import os
from sqlalchemy import create_engine, text

def migrate():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL not set.")
        return

    print(f"Connecting to: {url}")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            # 1. Drop old FK constraint
            print("Dropping old FK constraint (project_tasks_assignee_id_fkey)...")
            try:
                conn.execute(text("ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_assignee_id_fkey"))
                conn.commit()
            except Exception as e:
                print(f"  - Warning: {e}")

            # 2. Add new FK constraint to engineers
            print("Adding new FK constraint to engineers.id...")
            try:
                conn.execute(text("ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES engineers(id)"))
                conn.commit()
            except Exception as e:
                 print(f"  - Warning: {e}")
            
        print("Migration Complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
