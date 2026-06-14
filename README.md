Create a README.md file in the project root with exactly this content:

---

# 🃏 Cardle

> One hand. One guess. Every day.

Live at: https://cardle-six.vercel.app

---

## What is Cardle?

Cardle is a daily blackjack guessing game inspired by Wordle. Every day at midnight UTC, every player on the platform gets dealt the same 3-card blackjack hand. You have one chance to guess whether the dealer will beat your score. Get it right and your streak grows. Miss a day or guess wrong and it resets.

The game is intentionally simple — 30 seconds a day, one decision, one result. The streak mechanic is what keeps people coming back.

---

## Why I Built This

I built Cardle as a full-stack portfolio project with two goals:

1. **API Design** — I wanted to demonstrate how to design a clean, production-ready REST API from scratch. Every endpoint has a clear purpose, authentication is handled properly with JWT, game logic is separated from the database layer, and the API never leaks information the client shouldn't have (the dealer's hand is stored but never sent until after the user guesses).

2. **Real World Deployment** — I wanted to go beyond localhost. Cardle is fully deployed with a live database, live backend, and live frontend that real users can sign up for and play today.

---

## Tech Stack

**Backend**
- Python 3.12
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- JWT Authentication (python-jose + passlib + bcrypt)
- APScheduler (daily challenge generation)
- Deployed on Railway

**Frontend**
- React + TypeScript
- Vite
- Axios
- Deployed on Vercel

**External API**
- Deck of Cards API (deckofcardsapi.com) — used to draw real randomized cards for each daily challenge

---

## API Design

The API was designed with these principles:

**Never leak game state** — GET /challenge/today returns the player's cards and score but never the dealer's hand or the answer. The dealer hand is only revealed after the user submits their guess.

**One action per day enforced server-side** — the double-attempt check happens in the database, not the frontend. The frontend can be bypassed; the backend cannot.

**JWT on every protected route** — all game endpoints require a valid Bearer token. There is no way to play without an account.

**Streak logic lives in the backend** — the frontend never calculates or stores streak data. It only displays what the server returns.

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Get JWT token |
| GET | /challenge/today | Yes | Get today's hand |
| POST | /challenge/answer | Yes | Submit YES or NO guess |
| GET | /challenge/today/result | Yes | Check if already played today |
| GET | /leaderboard | Yes | Top 20 players by streak |

---

## Database Schema

**users** — id, username, email, hashed_password, current_streak, longest_streak, last_played_date

**challenges** — id, date (unique), player_cards (JSON), player_score, dealer_cards (JSON), dealer_score, answer

**attempts** — id, user_id, challenge_id, guess, correct, created_at

Cards are stored as JSON arrays instead of separate columns so the schema never breaks if a player draws additional cards.

---

## Game Logic

Scoring follows standard blackjack rules:
- Number cards = face value
- Jack, Queen, King = 10
- Ace = 11, drops to 1 if total would bust

The dealer draws until their score reaches 17 or higher. If the dealer's final score is greater than the player's score (and the dealer hasn't busted), the answer is YES. Otherwise NO. If both bust, the dealer did not beat the player — answer is NO.

---

## Local Setup

**Backend**
```bash
cd cardapi
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# fill in your DATABASE_URL and SECRET_KEY in .env
uvicorn main:app --reload
```

**Frontend**
```bash
cd cardapi-frontend
npm install
# create .env.local with VITE_API_URL=http://127.0.0.1:8000
npm run dev
```

API docs available at http://127.0.0.1:8000/docs

---

## Project Structure
