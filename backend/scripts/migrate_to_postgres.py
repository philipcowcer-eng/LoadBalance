import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os
import sys

# Requirements: pip install psycopg2-binary

def migrate():
    # 1. Connect to Source (SQLite)
    sqlite_db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'resource_manager.db')
    if not os.path.exists(sqlite_db_path):
        print(f"Error: SQLite DB not found at {sqlite_db_path}")
        return

    print(f"Reading from SQLite: {sqlite_db_path}")
    sqlite_conn = sqlite3.connect(sqlite_db_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # 2. Connect to Target (Postgres)
    pg_url = os.environ.get("DATABASE_URL")
    if not pg_url:
        print("Error: DATABASE_URL environment variable not set.")
        print("Usage: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname python migrate_to_postgres.py")
        return

    try:
        print(f"Connecting to Postgres...")
        pg_conn = psycopg2.connect(pg_url)
        pg_cursor = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to Postgres: {e}")
        return

    # 3. Define Tables to Migrate (Order matters for Foreign Keys!)
    tables = [
        "users",
        "engineers",
        "projects",
        "allocations",
        "project_tasks",
        "resourcing_requirements",
        "project_devices",
        "project_rid_logs",
        "project_notes",
        "project_members"
    ]

    # Cache IDs for FK validation
    valid_user_ids = set()
    valid_engineer_ids = set()
    valid_project_ids = set()

    try:
        # Pre-fetch valid IDs from SQLite
        sqlite_cursor.execute("SELECT id FROM users")
        valid_user_ids = {row[0] for row in sqlite_cursor.fetchall()}
        
        sqlite_cursor.execute("SELECT id FROM engineers")
        valid_engineer_ids = {row[0] for row in sqlite_cursor.fetchall()}

        # Note: We fetch project IDs *after* migrating projects? 
        # No, we can fetch from SQLite source.
        sqlite_cursor.execute("SELECT id FROM projects")
        valid_project_ids = {row[0] for row in sqlite_cursor.fetchall()}

        for table in tables:
            print(f"Migrating table: {table}...")
            
            # Read from SQLite
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                print(f"  - No data in {table}, skipping.")
                continue

            columns = rows[0].keys()
            column_names = ",".join(columns)
            
            cleaned_data = []
            skipped_count = 0
            
            for row in rows:
                row_dict = dict(row)
                should_skip = False
                
                # SANITIZATION LOGIC
                
                # 1. Project Tasks: Nullify bad Assignee
                if table == "project_tasks" and "assignee_id" in row_dict:
                    aid = row_dict["assignee_id"]
                    if aid and aid not in valid_user_ids:
                        row_dict["assignee_id"] = None
                
                # 2. Child Tables: Skip if Project missing
                if "project_id" in row_dict:
                    pid = row_dict["project_id"]
                    if pid and pid not in valid_project_ids:
                        should_skip = True

                # 3. Project Members: Skip if Engineer missing
                if table == "project_members" and "engineer_id" in row_dict:
                    eid = row_dict["engineer_id"]
                    if eid and eid not in valid_engineer_ids:
                        should_skip = True

                if should_skip:
                    skipped_count += 1
                    continue
                    
                cleaned_data.append(tuple(row_dict[col] for col in columns))

            if skipped_count > 0:
                print(f"    ! Skipped {skipped_count} orphan rows in {table}.")

            # Insert into Postgres
            if cleaned_data:
                query = f"INSERT INTO {table} ({column_names}) VALUES %s ON CONFLICT DO NOTHING"
                execute_values(pg_cursor, query, cleaned_data)
                print(f"  - Migrated {len(cleaned_data)} rows.")
            else:
                print(f"  - No valid rows to migrate for {table}.")

        pg_conn.commit()
        print("\nMigration Successful!")

    except Exception as e:
        pg_conn.rollback()
        print(f"\nMigration Failed: {e}")
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    migrate()
