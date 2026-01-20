from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Use /app/data in Docker (volume mount) or local path for development
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    # Postgres does not need check_same_thread
    connect_args = {}
else:
    DATA_DIR = os.environ.get("DATA_DIR", "./")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'resource_manager.db')}"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
