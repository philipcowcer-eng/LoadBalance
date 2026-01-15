"""
Authentication module for goodenough.to | Planning
US-0.1: User Authentication (Basic)

This module provides:
- User model with hashed passwords
- JWT token generation and validation
- Login/Register/Me endpoints
- Role-based access control (RBAC)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import uuid
import os

from database import get_db, Base

# =============================================================================
# Configuration
# =============================================================================

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token scheme
security = HTTPBearer(auto_error=False)

# =============================================================================
# User Model (SQLAlchemy)
# =============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="engineer")  # admin, resource_manager, project_manager, engineer
    created_at = Column(DateTime, default=datetime.utcnow)

# =============================================================================
# Pydantic Schemas
# =============================================================================

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "engineer"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# =============================================================================
# Helper Functions
# =============================================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, username: str, role: str) -> str:
    """Create a JWT access token."""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# Dependency: Get Current User
# =============================================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    Returns None if no token is provided (allows anonymous access for backward compatibility).
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_role(*allowed_roles: str):
    """
    Dependency factory to require specific roles.
    Usage: Depends(require_role("admin", "resource_manager"))
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Requires one of: {', '.join(allowed_roles)}")
        return current_user
    return role_checker

# =============================================================================
# Auth Router
# =============================================================================

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@auth_router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    First user becomes admin automatically.
    """
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # First user becomes admin
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else user_data.role
    
    # Validate role
    valid_roles = ["admin", "resource_manager", "project_manager", "engineer"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Create user
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    token = create_access_token(user.id, user.username, user.role)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )

@auth_router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with username and password.
    Returns JWT token on success.
    """
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token(user.id, user.username, user.role)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )

@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's info.
    """
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse.model_validate(current_user)

@auth_router.get("/users", response_model=list[UserResponse])
def get_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get all users (Admin only).
    """
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]
