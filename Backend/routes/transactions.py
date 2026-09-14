from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from backend.database import supabase
from backend.agents.hustler_notifier import send_sms_alert

router = APIRouter()

class EscrowRequest(BaseModel):
    gig_id: str
    client_id: str
    hustler_id: str
    amount: float
    action: str
    currency: str = "NGN" # Added currency to support SMS formatting

def fetch_phone_and_notify(user_id: str, message: str):
    """Helper function to fetch the user's phone number and trigger the SMS."""
    try:
        # Assuming your users table is named 'profiles' and has a 'phone_number' column
        profile = supabase.table("profiles").select("phone_number").eq("user_id", user_id).single().execute()
        phone_number = profile.data.get("phone_number") if profile.data else None
        
        if phone_number:
            send_sms_alert(to_phone=phone_number, message=message)
        else:
            print(f"No phone number on record for user {user_id}")
    except Exception as e:
        print(f"Failed to fetch phone or send SMS for {user_id}: {str(e)}")

@router.post("/process-intent")
async def process_escrow_intent(req: EscrowRequest, background_tasks: BackgroundTasks):
    if req.action == "release_escrow":
        try:
            res = supabase.rpc('release_escrow_funds', {
                'p_gig_id': req.gig_id,
                'p_hustler_id': req.hustler_id,
                'p_amount': req.amount
            }).execute()
            
            # 1. Trigger outbound SMS notification to the hustler as a background task
            alert_msg = f"Alert: {req.amount} {req.currency} has been released from escrow for gig {req.gig_id}."
            background_tasks.add_task(fetch_phone_and_notify, req.hustler_id, alert_msg)
            
            return {"status": "success", "message": f"Released {req.amount} from escrow."}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
            
    elif req.action == "match_gig":
        # 2. Trigger outbound SMS notification for locked funds
        match_msg = f"Success: Gig {req.gig_id} matched! {req.amount} {req.currency} is now securely locked in escrow."
        background_tasks.add_task(fetch_phone_and_notify, req.hustler_id, match_msg)
        
        return {"status": "success", "message": "Gig matched and funds locked in escrow."}
    
    raise HTTPException(status_code=400, detail="Unrecognized action intent.")