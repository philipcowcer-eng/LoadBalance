
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "resource_manager.db")

if not os.path.exists(DB_PATH):
    print(f"DB not found at {DB_PATH}")
    # Try alternate path if run from root differently
    DB_PATH = "backend/resource_manager.db"
    if not os.path.exists(DB_PATH):
        print(f"DB also not found at {DB_PATH}")
        exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("--- Engineers ---")
cursor.execute("SELECT id, name, role FROM engineers")
for row in cursor.fetchall():
    print(row)

print("\n--- Projects ---")
cursor.execute("SELECT id, name, owner_id, manager_id FROM projects")
for row in cursor.fetchall():
    print(row)

print("\n--- Impact Logs ---")
try:
    cursor.execute("SELECT * FROM impact_logs")
    rows = cursor.fetchall()
    if not rows:
        print("No rows found in impact_logs.")
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error querying impact_logs: {e}")

print("\n--- Project IDs ---")
cursor.execute("SELECT id FROM projects")
for row in cursor.fetchall():
    print(row)

conn.close()
