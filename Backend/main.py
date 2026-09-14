from fastapi import FastAPI
from routes import auth, users

app = FastAPI(title="AreaHustle Fintech API")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

@app.get("/")
async def root():
    return {"message": "AreaHustle Fintech Backend is live!"}