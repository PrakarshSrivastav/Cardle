from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    current_streak: int
    longest_streak: int


@router.get("", response_model=list[LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = (
        db.query(User)
        .filter(User.current_streak > 0)
        .order_by(User.current_streak.desc())
        .limit(20)
        .all()
    )
    return [
        LeaderboardEntry(
            rank=i + 1,
            username=u.username,
            current_streak=u.current_streak,
            longest_streak=u.longest_streak,
        )
        for i, u in enumerate(users)
    ]