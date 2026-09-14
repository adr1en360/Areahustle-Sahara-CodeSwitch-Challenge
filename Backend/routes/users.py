from fastapi import APIRouter, HTTPException, Depends, Header
from backend.database import db
from bson import ObjectId
import jwt
import os

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": "success",
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID format")