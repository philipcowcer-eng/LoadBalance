from database import engine, SessionLocal
from models import Base, GlobalPolicy
import json

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if Deep Work policy exists
    existing = db.query(GlobalPolicy).filter_by(policy_type="DEEP_WORK_DAYS").first()
    if not existing:
        policy = GlobalPolicy(
            policy_type="DEEP_WORK_DAYS",
            value=json.dumps(["Tue", "Thu"]),
            parameters=json.dumps({"violation_categories": ["Meetings", "Operational Support"]})
        )
        db.add(policy)
        db.commit()
        print("Created DEEP_WORK_DAYS policy.")
    else:
        print("DEEP_WORK_DAYS policy already exists.")
        
    db.close()

if __name__ == "__main__":
    init_db()
