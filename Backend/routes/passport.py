from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from database import db
from bson import ObjectId

router = APIRouter()

@router.post("/verify/{user_id}")
async def verify_identity(
    user_id: str,
    identity_type: str = Form(...),
    document_number: str = Form(...),
    id_document: UploadFile = File(None)
):
    try:
        file_name = id_document.filename if id_document else None
        verification_data = {
            "identity_type": identity_type,
            "document_number": document_number,
            "document_name": file_name,
            "kyc_status": "pending_verification"
        }
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)}, 
            {"$set": verification_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "status": "success", 
            "message": "Identity documentation submitted successfully", 
            "kyc_status": "pending_verification"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))