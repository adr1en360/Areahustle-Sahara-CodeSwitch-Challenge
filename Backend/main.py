import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

try:
    from .routes import auth, passport, tasks, transactions, users, voice
except ImportError:
    from routes import auth, passport, tasks, transactions, users, voice

app = FastAPI(title="AreaHustle Fintech API")

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://areahustle-backend.onrender.com",
]

# Allow extra origins configured for deployed frontend hosts.
configured_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
if configured_origins:
    allowed_origins.extend(
        origin.strip() for origin in configured_origins.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(passport.router, prefix="/api/passport", tags=["Passport"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice Pipeline"])

# Telephony webhooks (Twilio) are disabled for the hackathon submission.
# Code kept in agents/test_call.py and agents/watch_call.py for reference.
# app.include_router(watch_call.router, prefix="/api/voice", tags=["Voice Webhooks"])
# app.include_router(test_call.router, prefix="/api/voice", tags=["Voice Webhooks"])

@app.get("/")
async def root():
    return {"message": "AreaHustle Fintech Backend is live!"}