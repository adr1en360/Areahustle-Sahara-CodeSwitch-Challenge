import os
from google import genai
from pydantic import BaseModel, Field

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GigIntent(BaseModel):
    action: str = Field(description="The action to take, e.g., 'match_gig', 'release_escrow', 'dispute'")
    amount: float = Field(description="The financial amount mentioned, or 0.0 if none")
    currency: str = Field(description="The currency mentioned, usually 'NGN' or 'USD'")
    summary: str = Field(description="A brief English summary of the user's code-switched request")

def extract_intent(sahara_transcript: str) -> GigIntent:
    prompt = f"Analyze this user transcript from a voice-first job marketplace: '{sahara_transcript}'"
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': GigIntent,
            'temperature': 0.1,
        },
    )
    return response.parsed