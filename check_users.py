
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Connect to the SQLite database
# Using valid DB path
DB_URL = "sqlite:///./backend/resource_manager.db"

try:
    engine = create_engine(DB_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT username, role FROM users"))
        print(f"{'USERNAME':<20} | {'ROLE':<15}")
        print("-" * 38)
        for row in result:
            print(f"{row[0]:<20} | {row[1]:<15}")
except Exception as e:
    print(f"Error: {e}")
