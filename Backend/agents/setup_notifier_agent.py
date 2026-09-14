import os
import urllib.parse
from twilio.rest import Client

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

def trigger_voice_alert(to_phone: str, announcement: str):
    """Initiates an outbound call using TwiML to speak the alert."""
    encoded_message = urllib.parse.quote(announcement)
    # Uses a Twimlet to generate dynamic TwiML on the fly
    twiml_url = f"http://twimlets.com/echo?Twiml=%3CResponse%3E%3CSay%20voice%3D%27Polly.Ayanda%27%3E{encoded_message}%3C%2FSay%3E%3C%2FResponse%3E"
    
    try:
        call = client.calls.create(
            url=twiml_url,
            to=to_phone,
            from_=TWILIO_PHONE_NUMBER
        )
        return {"status": "success", "call_sid": call.sid}
    except Exception as e:
        return {"status": "error", "details": str(e)}