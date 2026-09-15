from fastapi import APIRouter, HTTPException
from bson import ObjectId
import jwt
import os

try:
    from ..database import db
except ImportError:
    from database import db

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


@router.get("/wallet/{user_id}")
async def get_wallet(user_id: str):
    """Current server-side wallet balance for a user."""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)}, {"wallet_balance": 1})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"wallet_balance": round(float(user.get("wallet_balance") or 0), 2)}


@router.post("/wallet/{user_id}/topup")
async def topup_wallet(user_id: str, payload: dict):
    """Credit (or debit, negative amount) a user's wallet and log the transaction."""
    try:
        amount = float(payload.get("amount", 0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Amount must be a number")
    if amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")

    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    from datetime import datetime
    txn_type = "topup" if amount > 0 else "withdrawal"
    result = await db.users.update_one(
        {"_id": oid},
        {
            "$inc": {"wallet_balance": amount},
            "$push": {"transactions": {
                "type": txn_type,
                "amount": abs(amount),
                "date": "Today",
                "desc": f"Wallet {txn_type}",
                "location": "Lagos",
            }},
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await db.users.find_one({"_id": oid}, {"wallet_balance": 1})
    return {"wallet_balance": round(float(updated.get("wallet_balance") or 0), 2)}