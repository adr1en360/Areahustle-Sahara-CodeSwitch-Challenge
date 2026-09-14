from fastapi import APIRouter, Request, BackgroundTasks
import httpx
import os

router = APIRouter()
SAHARA_API_KEY = os.getenv("SAHARA_API_KEY")
SAHARA_ENDPOINT = "https://infer.voice.intron.io/file/v1/upload/sync"

async def transcribe_and_execute(audio_url: str, caller_phone: str):
    """Fetches audio from Twilio and sends it to Sahara v2.5."""
    async with httpx.AsyncClient() as client:
        # 1. Fetch Twilio Audio
        audio_response = await client.get(audio_url)
        audio_data = audio_response.content

        # 2. Send to Sahara v2.5 (sync endpoint)
        headers = {"Authorization": f"Bearer {SAHARA_API_KEY}"}
        data = {"audio_file_name": "recording.wav", "use_language_asr_input": "pcm"}
        files = {"audio_file_blob": ("recording.wav", audio_data, "audio/wav")}

        sahara_res = await client.post(SAHARA_ENDPOINT, headers=headers, data=data, files=files)
        transcript = sahara_res.json().get("data", {}).get("audio_transcript", "")

        # 3. (Next Phase) Pass `transcript` to Gemini for intent extraction
        print(f"Sahara Transcript for {caller_phone}: {transcript}")

@router.post("/process-recording")
async def process_recording(request: Request, background_tasks: BackgroundTasks):
    form_data = await request.form()
    audio_url = form_data.get("RecordingUrl")
    caller_phone = form_data.get("From")

    if audio_url:
        # Process the transcription in the background so Twilio doesn't time out
        background_tasks.add_task(transcribe_and_execute, audio_url, caller_phone)

    # End the call smoothly
    from twilio.twiml.voice_response import VoiceResponse
    response = VoiceResponse()
    response.say("Your request is being processed. We will text you shortly.")
    response.hangup()
    
    return HTMLResponse(content=str(response), media_type="application/xml")