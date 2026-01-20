import os
import sys

# Add parent directory to path so we can import backend definition
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from backend import models

def init_schema():
    print(f"Initializing Schema for URL: {os.environ.get('DATABASE_URL')}")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Schema Created Successfully in Postgres.")
    except Exception as e:
        print(f"Error creating schema: {e}")

if __name__ == "__main__":
    init_schema()
