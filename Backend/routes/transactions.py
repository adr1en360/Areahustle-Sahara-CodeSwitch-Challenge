from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from bson import ObjectId

try:
    from ..database import db
    from ..agents.hustler_notifier import send_sms_alert
except ImportError:
    from database import db
    from agents.hustler_notifier import send_sms_alert

router = APIRouter()

class EscrowRequest(BaseModel):
    gig_id: str
    client_id: str
    hustler_id: str
    amount: float
    action: str
    currency: str = "NGN"

async def fetch_phone_and_notify(user_id: str, message: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        phone_number = user.get("phone_number") if user else None
        
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
            alert_msg = f"Alert: {req.amount} {req.currency} has been released from escrow for gig {req.gig_id}."
            background_tasks.add_task(fetch_phone_and_notify, req.hustler_id, alert_msg)
            return {"status": "success", "message": f"Released {req.amount} from escrow."}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
            
    elif req.action == "match_gig":
        match_msg = f"Success: Gig {req.gig_id} matched! {req.amount} {req.currency} is now securely locked in escrow."
        background_tasks.add_task(fetch_phone_and_notify, req.hustler_id, match_msg)
        return {"status": "success", "message": "Gig matched and funds locked in escrow."}
    
    raise HTTPException(status_code=400, detail="Unrecognized action intent.")