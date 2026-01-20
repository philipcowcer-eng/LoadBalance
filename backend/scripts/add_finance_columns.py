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
            # Add finance_code
            print("Adding finance_code column...")
            try:
                conn.execute(text("ALTER TABLE projects ADD COLUMN finance_code VARCHAR"))
                conn.commit()
            except Exception as e:
                print(f"  - Skipped (might exist): {e}")

            # Add budget_cap
            print("Adding budget_cap column...")
            try:
                conn.execute(text("ALTER TABLE projects ADD COLUMN budget_cap FLOAT DEFAULT 0.0"))
                conn.commit()
            except Exception as e:
                 print(f"  - Skipped (might exist): {e}")
            
        print("Migration Complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
