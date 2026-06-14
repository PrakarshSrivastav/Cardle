export interface Card {
  code: string;
  value: string;
  suit: string;
  image: string;
}

export interface Challenge {
  date: string;
  cards: Card[];
  score: number;
  question: string;
}

export interface AnswerResponse {
  correct: boolean;
  message: string;
  streak: number;
  dealer_cards: Card[];
  dealer_score: number;
  player_score: number;
  answer: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  current_streak: number;
  longest_streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  current_streak: number;
  longest_streak: number;
}
