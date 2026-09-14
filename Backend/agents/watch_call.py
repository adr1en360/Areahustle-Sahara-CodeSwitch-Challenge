from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from twilio.twiml.voice_response import VoiceResponse

router = APIRouter()

@router.post("/inbound-call")
async def handle_incoming_call(request: Request):
    """Answers the call and prompts the hustler or client."""
    response = VoiceResponse()
    
    # Prompt the caller in a localized tone
    response.say("Welcome to AreaHustle. Please state the gig you need, or the task you just completed, after the beep.", voice="Polly.Ayanda")
    
    # Record the response and forward the audio URL to the transcription handler
    response.record(
        max_length=30, 
        action="/api/voice/process-recording", 
        recording_status_callback="/api/voice/recording-status"
    )
    
    return HTMLResponse(content=str(response), media_type="application/xml")