from datetime import date, timezone, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, Challenge, Attempt
from app.game.scorer import score_hand, dealer_draw, determine_answer
from app.game.deck_client import shuffle_new_deck, draw_cards, make_draw_fn

router = APIRouter(prefix="/challenge", tags=["challenge"])


class CardOut(BaseModel):
    code: str
    value: str
    suit: str
    image: str


class ChallengeOut(BaseModel):
    date: date
    cards: list[CardOut]
    score: int
    question: str


class AnswerRequest(BaseModel):
    guess: str


class AnswerResponse(BaseModel):
    correct: bool
    message: str
    streak: int
    dealer_cards: list[CardOut]
    dealer_score: int
    player_score: int
    answer: str


class ResultResponse(BaseModel):
    already_played: bool
    guess: str | None = None
    correct: bool | None = None
    streak: int


def get_or_create_today_challenge(db: Session) -> Challenge:
    today = date.today()
    challenge = db.query(Challenge).filter(Challenge.date == today).first()
    if challenge:
        return challenge

    deck_id = shuffle_new_deck()
    player_cards = draw_cards(deck_id, 3)
    player_score = score_hand(player_cards)

    dealer_start = draw_cards(deck_id, 2)
    dealer_hand, dealer_score = dealer_draw(dealer_start, make_draw_fn(deck_id))
    answer = determine_answer(player_score, dealer_score)

    challenge = Challenge(
        date=today,
        player_cards=player_cards,
        player_score=player_score,
        dealer_cards=dealer_hand,
        dealer_score=dealer_score,
        answer=answer,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.get("/today", response_model=ChallengeOut)
def get_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = get_or_create_today_challenge(db)
    return ChallengeOut(
        date=challenge.date,
        cards=[CardOut(**c) for c in challenge.player_cards],
        score=challenge.player_score,
        question="Will the dealer beat you?" if challenge.player_score <= 21
                 else "You busted! Will the dealer bust too?",
    )


@router.post("/answer", response_model=AnswerResponse)
def submit_answer(
    body: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    guess = body.guess.upper()
    if guess not in ("YES", "NO"):
        raise HTTPException(status_code=400, detail="Guess must be YES or NO")

    challenge = get_or_create_today_challenge(db)

    existing = (
        db.query(Attempt)
        .filter(Attempt.user_id == current_user.id)
        .filter(Attempt.challenge_id == challenge.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already answered today's challenge")

    correct = guess == challenge.answer

    today = date.today()
    if correct:
        last = current_user.last_played_date
        if last and (today - last).days == 1:
            current_user.current_streak += 1
        else:
            current_user.current_streak = 1
        if current_user.current_streak > current_user.longest_streak:
            current_user.longest_streak = current_user.current_streak
    else:
        current_user.current_streak = 0

    current_user.last_played_date = today

    attempt = Attempt(
        user_id=current_user.id,
        challenge_id=challenge.id,
        guess=guess,
        correct=correct,
    )
    db.add(attempt)
    db.commit()

    if correct:
        message = f"Correct! Your streak is now {current_user.current_streak} days"
    else:
        message = f"Wrong. The answer was {challenge.answer}. Streak reset."

    return AnswerResponse(
        correct=correct,
        message=message,
        streak=current_user.current_streak,
        dealer_cards=[CardOut(**c) for c in challenge.dealer_cards],
        dealer_score=challenge.dealer_score,
        player_score=challenge.player_score,
        answer=challenge.answer,
    )


@router.get("/today/result", response_model=ResultResponse)
def get_result(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = get_or_create_today_challenge(db)
    attempt = (
        db.query(Attempt)
        .filter(Attempt.user_id == current_user.id)
        .filter(Attempt.challenge_id == challenge.id)
        .first()
    )
    if not attempt:
        return ResultResponse(already_played=False, streak=current_user.current_streak)

    return ResultResponse(
        already_played=True,
        guess=attempt.guess,
        correct=attempt.correct,
        streak=current_user.current_streak,
    )
