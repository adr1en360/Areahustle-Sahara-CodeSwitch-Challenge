from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from backend.database import supabase
from backend.routes.users import get_current_user

router = APIRouter()

@router.post("/verify")
async def verify_identity(
    identity_type: str = Form(...),
    document_number: str = Form(...),
    id_document: UploadFile = File(None),
    current_user = Depends(get_current_user)
):
    user_id = current_user.user.id

    try:
        # If a document is uploaded, save it to a secure Supabase storage bucket
        document_url = None
        if id_document:
            file_path = f"kyc_docs/{user_id}_{id_document.filename}"
            supabase.storage.from_("secure-documents").upload(file_path, await id_document.read())
            document_url = supabase.storage.from_("secure-documents").get_public_url(file_path)

        verification_data = {
            "identity_type": identity_type,
            "document_number": document_number,
            "document_url": document_url,
            "kyc_status": "pending_verification"
        }

        # Bind the KYC data to the authenticated user's profile
        res = supabase.table("profiles").update(verification_data).eq("user_id", user_id).execute()

        return {
            "message": "Identity documentation submitted successfully", 
            "kyc_status": "pending_verification"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))