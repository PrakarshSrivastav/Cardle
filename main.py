from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.db import models
from app.api.routes import auth, challenge, leaderboard

app = FastAPI(
    title="Cardle",
    description="One blackjack hand per day. Build your streak.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://cardle-six.vercel.app",
        "https://cardle-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(challenge.router)
app.include_router(leaderboard.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "message": "Cardle API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}