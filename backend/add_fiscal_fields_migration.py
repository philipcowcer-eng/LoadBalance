from sqlalchemy import create_engine, text
import os

# Database URL
DATABASE_URL = "sqlite:///./resource_manager.db"

def run_migration():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Check if columns exist to avoid errors
        result = connection.execute(text("PRAGMA table_info(projects)"))
        columns = [row[1] for row in result.fetchall()]
        
        # Add fiscal_year if missing
        if 'fiscal_year' not in columns:
            print("Adding fiscal_year column...")
            connection.execute(text("ALTER TABLE projects ADD COLUMN fiscal_year VARCHAR"))
        else:
            print("fiscal_year column already exists.")
            
        # Add device_count if missing
        if 'device_count' not in columns:
            print("Adding device_count column...")
            connection.execute(text("ALTER TABLE projects ADD COLUMN device_count INTEGER DEFAULT 0"))
        else:
            print("device_count column already exists.")
            
        # Add device_type if missing
        if 'device_type' not in columns:
            print("Adding device_type column...")
            connection.execute(text("ALTER TABLE projects ADD COLUMN device_type VARCHAR"))
        else:
            print("device_type column already exists.")

        connection.commit()
        print("Migration complete!")

if __name__ == "__main__":
    run_migration()
