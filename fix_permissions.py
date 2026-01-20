
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Connect to the SQLite database
DB_URL = "sqlite:///./backend/resource_manager.db"

try:
    engine = create_engine(DB_URL)
    with engine.connect() as connection:
        # Update dmin2admin to admin
        result = connection.execute(text("UPDATE users SET role = 'admin' WHERE username = 'dmin2admin'"))
        connection.commit()
        print(f"Updated {result.rowcount} row(s).")
        
        # Verify
        result = connection.execute(text("SELECT username, role FROM users WHERE username = 'dmin2admin'"))
        for row in result:
            print(f"New Role for {row[0]}: {row[1]}")

except Exception as e:
    print(f"Error: {e}")
