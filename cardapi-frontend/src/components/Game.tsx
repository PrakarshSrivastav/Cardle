import { useState, useEffect } from "react";
import api from "../api";
import type { Challenge, AnswerResponse, Card, LeaderboardEntry } from "../types";

interface Props {
  onLogout: () => void;
}

const SUIT_SYMBOL: Record<string, string> = {
  HEARTS: "♥", DIAMONDS: "♦", CLUBS: "♣", SPADES: "♠"
};

const SUIT_COLOR: Record<string, string> = {
  HEARTS: "#c0392b", DIAMONDS: "#c0392b", CLUBS: "#1a1a1a", SPADES: "#1a1a1a"
};

function formatValue(value: string) {
  if (value === "ACE") return "A";
  if (value === "KING") return "K";
  if (value === "QUEEN") return "Q";
  if (value === "JACK") return "J";
  return value;
}

function PlayingCard({ card }: { card: Card }) {
  const label = formatValue(card.value);
  const color = SUIT_COLOR[card.suit];
  const suit = SUIT_SYMBOL[card.suit];

  return (
    <div style={styles.playingCard}>
      <div style={{ ...styles.cardCorner, top: 6, left: 6, color }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 12, marginTop: -2 }}>{suit}</div>
      </div>
      
      <div style={{ ...styles.cardCenter, color }}>{suit}</div>
      
      <div style={{ 
        position: "absolute",
        bottom: "6px",
        right: "8px",
        transform: "rotate(180deg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color 
      }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 12, marginTop: -2 }}>{suit}</div>
      </div>
    </div>
  );
}

export default function Game({ onLogout }: Props) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guessing, setGuessing] = useState(false);
  const [streak, setStreak] = useState(0);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    document.title = "Cardle";
    loadChallenge();
  }, []);

  async function loadChallenge() {
    setLoading(true);
    try {
      const [todayRes, resultRes] = await Promise.all([
        api.get("/challenge/today"),
        api.get("/challenge/today/result"),
      ]);
      setChallenge(todayRes.data);
      setStreak(resultRes.data.streak);
      if (resultRes.data.already_played) {
        setAlreadyPlayed(true);
      }
    } catch {
      onLogout();
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeaderboard() {
    setLoadingLeaderboard(true);
    setShowLeaderboard(true);
    try {
      const res = await api.get("/leaderboard");
      setLeaderboard(res.data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    } finally {
      setLoadingLeaderboard(false);
    }
  }

  async function submitGuess(guess: "YES" | "NO") {
    setGuessing(true);
    try {
      const res = await api.post("/challenge/answer", { guess });
      setResult(res.data);
      setStreak(res.data.streak);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error");
    } finally {
      setGuessing(false);
    }
  }

  async function handleBust() {
    await submitGuess("NO");
  }

  if (loading) return (
    <div style={styles.loadingPage}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={styles.loadingCard}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Dealing your hand...</div>
      </div>
    </div>
  );
  if (!challenge) return <div style={styles.loader}>No challenge found.</div>;

  const bust = challenge.score > 21;

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return "#fff";
  };

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        body { 
          margin: 0; 
          background: #0a0a0a; 
          font-family: 'Inter', sans-serif;
          color: white;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px rgba(243, 156, 18, 0.5); border-color: rgba(243, 156, 18, 0.4); }
          50% { box-shadow: 0 0 15px rgba(243, 156, 18, 0.8); border-color: rgba(243, 156, 18, 0.9); }
          100% { box-shadow: 0 0 5px rgba(243, 156, 18, 0.5); border-color: rgba(243, 156, 18, 0.4); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: all 0.2s ease; cursor: pointer; }
        button:hover { filter: brightness(1.1); transform: translateY(-1px); }
        button:active { transform: translateY(0); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {showLeaderboard && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <button style={styles.closeBtn} onClick={() => setShowLeaderboard(false)}>✕</button>
            <h2 style={styles.overlayTitle}>🏆 Leaderboard</h2>
            
            {loadingLeaderboard ? (
              <div style={styles.overlayMessage}>Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div style={styles.overlayMessage}>No streaks yet. Be the first!</div>
            ) : (
              <div style={styles.leaderboardList}>
                {leaderboard.map((entry) => (
                  <div key={entry.username} style={styles.leaderboardItem}>
                    <div style={{ ...styles.rank, color: getRankColor(entry.rank) }}>
                      {entry.rank}
                    </div>
                    <div style={styles.userName}>{entry.username}</div>
                    <div style={styles.userStreaks}>
                      <span style={{ color: "#f39c12", fontWeight: 700 }}>🔥 {entry.current_streak}</span>
                      <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>best: {entry.longest_streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showHowToPlay && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <h2 style={styles.overlayTitle}>How to Play</h2>
            <div style={styles.howToPlayContent}>
              <div style={styles.howToItem}>🃏 You're dealt 3 cards. Your score is calculated blackjack style.</div>
              <div style={styles.howToItem}>🎯 Guess: Will the dealer beat your score? Answer YES or NO.</div>
              <div style={styles.howToItem}>♠ Aces = 11 (drops to 1 if bust). Face cards = 10.</div>
              <div style={styles.howToItem}>💥 If you bust (score &gt; 21), dealer wins automatically.</div>
              <div style={styles.howToItem}>🔥 Answer correctly every day to build your streak.</div>
              <div style={styles.howToItem}>⏰ One challenge per day. New hand at midnight UTC.</div>
            </div>
            <button style={styles.fullWidthBtn} onClick={() => setShowHowToPlay(false)}>CLOSE</button>
          </div>
        </div>
      )}

      <header style={styles.topBar}>
        <div style={{ ...styles.topBarSection, ...styles.topBarLeft }}>
          <div style={{ 
            ...styles.streakBadge, 
            ...(streak > 0 ? { animation: "pulseGlow 2s infinite" } : {}) 
          }}>
            {streak > 0 ? `🔥 ${streak}` : "0"}
          </div>
        </div>
        
        <div style={{ ...styles.topBarSection, ...styles.topBarCenter }}>
          <button style={styles.navBtn} onClick={fetchLeaderboard}>🏆 LEADERBOARD</button>
          <button style={styles.helpCircleSmall} onClick={() => setShowHowToPlay(true)}>?</button>
        </div>
        
        <div style={{ ...styles.topBarSection, ...styles.topBarRight }}>
          <button style={styles.logoutBtn} onClick={onLogout}>LOGOUT</button>
        </div>
      </header>

      <div style={styles.gameContainer}>
        <div style={styles.heroSection}>
          <h1 style={styles.mainTitle}>🃏 Cardle</h1>
          <p style={styles.dateText}>{challenge.date}</p>
        </div>

        <div style={styles.tableArea}>
          <div style={styles.handSection}>
            <span style={styles.sectionLabel}>YOUR HAND</span>
            <div style={styles.cardRow}>
              {challenge.cards.map((c) => <PlayingCard key={c.code} card={c} />)}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ ...styles.scorePill, background: bust ? "#e74c3c" : "#2ecc71" }}>
                {bust ? "BUST 💥" : `SCORE: ${challenge.score}`}
              </div>
            </div>
          </div>

          {bust && !result && !alreadyPlayed && (
            <div style={styles.actionSection}>
              <div style={styles.bustMessage}>You busted. Dealer wins automatically</div>
              <button style={styles.revealBtn} onClick={handleBust} disabled={guessing}>
                {guessing ? "REVEALING..." : "REVEAL DEALER"}
              </button>
            </div>
          )}

          {!bust && !result && !alreadyPlayed && (
            <div style={styles.actionSection}>
              <h2 style={styles.questionText}>{challenge.question}</h2>
              <div style={styles.buttonStack}>
                <button style={styles.yesBtn} onClick={() => submitGuess("YES")} disabled={guessing}>
                  YES
                </button>
                <button style={styles.noBtn} onClick={() => submitGuess("NO")} disabled={guessing}>
                  NO
                </button>
              </div>
            </div>
          )}

          {result && (
            <div style={styles.resultSection}>
              <div style={{ 
                ...styles.resultStatus, 
                color: result.correct ? "#2ecc71" : "#e74c3c" 
              }}>
                {result.correct ? "CORRECT!" : "WRONG!"}
              </div>
              <p style={styles.resultMessage}>{result.message}</p>
              <div style={styles.streakUpdate}>
                {result.streak > 0 ? `🔥 ${result.streak} day streak` : "Streak reset"}
              </div>

              <div style={{ height: 2, background: "#1e1e1e", margin: "24px 0" }} />

              <span style={styles.sectionLabel}>DEALER'S HAND</span>
              <div style={styles.cardRow}>
                {result.dealer_cards.map((c) => <PlayingCard key={c.code} card={c} />)}
              </div>

              <div style={styles.summaryRow}>
                <div style={styles.summaryPill}>YOU: {result.player_score > 21 ? "BUST" : result.player_score}</div>
                <div style={styles.summaryPill}>DEALER: {result.dealer_score > 21 ? "BUST" : result.dealer_score}</div>
              </div>
            </div>
          )}

          {alreadyPlayed && !result && (
            <div style={styles.alreadyPlayedBox}>
              ✅ Already played today. Come back tomorrow!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 0 40px",
  },
  loadingPage: {
    position: "fixed",
    inset: 0,
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingCard: {
    background: "#111",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #333",
    borderTopColor: "#2ecc71",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
    marginTop: 16,
    fontWeight: 500,
  },
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#666",
    fontSize: 18,
    fontWeight: 700,
  },
  gameContainer: {
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    padding: "0 16px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px",
    position: "sticky",
    top: 0,
    background: "rgba(10,10,10,0.95)",
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },
  topBarSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
  },
  topBarLeft: { justifyContent: "flex-start" },
  topBarCenter: { justifyContent: "center", gap: 8 },
  topBarRight: { justifyContent: "flex-end" },
  streakBadge: {
    padding: "6px 12px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 800,
    background: "#111",
    border: "1px solid #1e1e1e",
    color: "#f39c12",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  helpCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1px solid #333",
    background: "transparent",
    color: "#666",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  logoutBtn: {
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  heroSection: {
    textAlign: "center",
    margin: "40px 0",
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 900,
    margin: 0,
    letterSpacing: "-1px",
  },
  dateText: {
    color: "#666",
    fontSize: 13,
    marginTop: 6,
    fontWeight: 500,
  },
  tableArea: {
    position: "relative",
    background: "radial-gradient(ellipse at center, #1a3a2a 0%, #0a0a0a 70%)",
    padding: "20px 0",
    borderRadius: 24,
  },
  handSection: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 32,
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  sectionLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 800,
    color: "#666",
    letterSpacing: "0.15em",
    textAlign: "center",
    marginBottom: 16,
  },
  cardRow: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  playingCard: {
    width: 72,
    height: 104,
    background: "#fff",
    borderRadius: 10,
    position: "relative",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
    color: "#000",
  },
  cardCorner: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    lineHeight: 1,
    fontSize: 14,
  },
  cardCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 36,
  },
  scorePill: {
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 900,
    color: "#000",
    display: "inline-block",
  },
  actionSection: {
    textAlign: "center",
  },
  bustMessage: {
    color: "#666",
    fontSize: 15,
    marginBottom: 16,
    fontWeight: 500,
  },
  revealBtn: {
    width: "100%",
    padding: "18px",
    borderRadius: 12,
    background: "#333",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    border: "none",
  },
  questionText: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 24,
    color: "#fff",
  },
  buttonStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  yesBtn: {
    width: "100%",
    padding: "18px",
    borderRadius: 12,
    background: "#2ecc71",
    color: "#000",
    fontWeight: 900,
    fontSize: 18,
    border: "none",
  },
  noBtn: {
    width: "100%",
    padding: "18px",
    borderRadius: 12,
    background: "#e74c3c",
    color: "#fff",
    fontWeight: 900,
    fontSize: 18,
    border: "none",
  },
  resultSection: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 16,
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  resultStatus: {
    fontSize: 32,
    fontWeight: 900,
    marginBottom: 8,
  },
  resultMessage: {
    color: "#888",
    fontSize: 15,
    margin: "0 0 8px 0",
  },
  streakUpdate: {
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  summaryPill: {
    background: "#1e1e1e",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#888",
  },
  alreadyPlayedBox: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    padding: "40px 0",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  overlayCard: {
    width: "100%",
    maxWidth: 440,
    background: "#111",
    borderRadius: 16,
    padding: 32,
    position: "relative",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 20,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 800,
    margin: "0 0 24px 0",
    textAlign: "center",
  },
  overlayMessage: {
    textAlign: "center",
    color: "#666",
    padding: "20px 0",
  },
  leaderboardList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  leaderboardItem: {
    display: "flex",
    alignItems: "center",
    background: "#0a0a0a",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #1e1e1e",
  },
  rank: {
    fontSize: 18,
    fontWeight: 800,
    width: 32,
  },
  userName: {
    flex: 1,
    fontWeight: 600,
    fontSize: 15,
  },
  userStreaks: {
    textAlign: "right",
  },
  howToPlayContent: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 32,
  },
  howToItem: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 1.5,
  },
  fullWidthBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    background: "#333",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    border: "none",
  },
};
