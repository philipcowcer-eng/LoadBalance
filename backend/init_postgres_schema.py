import os
import sys

from database import engine
import models

def init_schema():
    print(f"Initializing Schema for URL: {os.environ.get('DATABASE_URL')}")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Schema Created Successfully in Postgres.")
    except Exception as e:
        print(f"Error creating schema: {e}")

if __name__ == "__main__":
    init_schema()
