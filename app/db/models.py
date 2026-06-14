from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Integer, String, Boolean, DateTime, Date,
    ForeignKey, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_played_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    attempts: Mapped[list["Attempt"]] = relationship("Attempt", back_populates="user")


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)

    player_cards: Mapped[list] = mapped_column(JSON, nullable=False)
    player_score: Mapped[int] = mapped_column(Integer, nullable=False)

    dealer_cards: Mapped[list] = mapped_column(JSON, nullable=False)
    dealer_score: Mapped[int] = mapped_column(Integer, nullable=False)

    answer: Mapped[str] = mapped_column(String(3), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    attempts: Mapped[list["Attempt"]] = relationship("Attempt", back_populates="challenge")


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    challenge_id: Mapped[int] = mapped_column(Integer, ForeignKey("challenges.id"), nullable=False)
    guess: Mapped[str] = mapped_column(String(3), nullable=False)
    correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="attempts")
    challenge: Mapped["Challenge"] = relationship("Challenge", back_populates="attempts")
