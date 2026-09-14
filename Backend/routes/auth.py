from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import supabase

router = APIRouter()

class UserCredentials(BaseModel):
    email: str
    password: str
    role: str # 'hustler' or 'client'

@router.post("/signup")
async def signup(user: UserCredentials):
    try:
        res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {"data": {"role": user.role}}
        })
        return {"message": "User created successfully", "user": res.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(user: UserCredentials):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {"access_token": res.session.access_token, "user": res.user}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")