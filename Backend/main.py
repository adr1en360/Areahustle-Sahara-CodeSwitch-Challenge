import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

try:
    from .routes import auth, passport, tasks, transactions, users
except ImportError:
    from routes import auth, passport, tasks, transactions, users

app = FastAPI(title="AreaHustle Fintech API")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(passport.router, prefix="/api/passport", tags=["Passport"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])

@app.get("/")
async def root():
    return {"message": "AreaHustle Fintech Backend is live!"}