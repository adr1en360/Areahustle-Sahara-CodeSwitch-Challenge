from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import bcrypt
from datetime import datetime

try:
    from ..database import db
except ImportError:
    from database import db

router = APIRouter()

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(user: UserSignup):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Hash password directly using bcrypt to avoid passlib Python 3.14 crashes
    pwd_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

    user_doc = {
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
        
    result = await db.users.insert_one(user_doc)
    return {"status": "success", "user_id": str(result.inserted_id), "role": user.role}

@router.post("/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    # Verify password directly using bcrypt
    is_valid = bcrypt.checkpw(
        user.password.encode('utf-8'), 
        db_user["password"].encode('utf-8')
    )
    
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    return {
        "status": "success", 
        "user_id": str(db_user["_id"]), 
        "role": db_user["role"],
        "message": "Login successful"
    }