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
      <div style={{ ...styles.cardCorner, top: 4, left: 6, color }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 11, marginTop: -2 }}>{suit}</div>
      </div>
      
      <div style={{ ...styles.cardCenter, color }}>{suit}</div>
      
      <div style={{ 
        position: "absolute",
        bottom: "4px",
        right: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color 
      }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 11, marginTop: -2 }}>{suit}</div>
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
  const [showRules, setShowRules] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [revealedCards, setRevealedCards] = useState<number>(0);

  useEffect(() => {
    document.title = "Cardle";
    loadChallenge();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!result) return;
    setRevealedCards(0);
    result.dealer_cards.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCards(index + 1);
      }, (index + 1) * 800);
    });
  }, [result]);

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

  function calcScore(cards: Card[]): number {
    const VALUES: Record<string, number> = {
      ACE: 11, KING: 10, QUEEN: 10, JACK: 10
    };
    let total = 0;
    let aces = 0;
    for (const card of cards) {
      const v = VALUES[card.value] ?? parseInt(card.value);
      if (card.value === "ACE") aces++;
      total += v;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
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
    return "#e8e8e8";
  };

  const RulesList = () => (
    <div style={styles.rulesList}>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>THE HAND</div>
        <div style={styles.ruleDesc}>You are dealt 3 cards every day. Everyone gets the same hand.</div>
      </div>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>YOUR GOAL</div>
        <div style={styles.ruleDesc}>Guess whether the dealer will beat your score. Answer YES or NO.</div>
      </div>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>SCORING</div>
        <div style={styles.ruleDesc}>Number cards are face value. Face cards are 10. Aces are 11, dropping to 1 if you would bust.</div>
      </div>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>THE DEALER</div>
        <div style={styles.ruleDesc}>The dealer draws until they reach 17 or higher. If they beat your score, the answer is YES.</div>
      </div>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>BUSTING</div>
        <div style={styles.ruleDesc}>If your score exceeds 21 you bust. Guess whether the dealer also busts.</div>
      </div>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>STREAKS</div>
        <div style={styles.ruleDesc}>Answer correctly every day to build your streak. Miss a day or guess wrong and it resets to zero.</div>
      </div>
      <div style={styles.ruleItem}>
        <div style={styles.ruleLabel}>ONE CHANCE</div>
        <div style={styles.ruleDesc}>One hand per day. New cards at midnight UTC.</div>
      </div>
    </div>
  );

  return (
    <div style={{
      ...styles.pageWrapper,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "300px 1fr",
      gap: isMobile ? "24px" : "48px",
      padding: isMobile ? "24px" : "40px 24px",
    }}>
      <style>{`
        body { 
          margin: 0; 
          background: #0a0a0a; 
          font-family: 'Inter', sans-serif;
          color: #e8e8e8;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        button { transition: all 0.2s ease; cursor: pointer; }
        button:hover { opacity: 0.85; }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {showLeaderboard && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <button style={styles.closeBtn} onClick={() => setShowLeaderboard(false)}>✕</button>
            <h2 style={styles.overlayTitle}>Leaderboard</h2>
            
            {loadingLeaderboard ? (
              <div style={styles.overlayMessage}>Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div style={styles.overlayMessage}>No streaks yet.</div>
            ) : (
              <div style={styles.leaderboardList}>
                {leaderboard.map((entry) => (
                  <div key={entry.username} style={styles.leaderboardItem}>
                    <div style={{ ...styles.rank, color: getRankColor(entry.rank) }}>
                      {entry.rank}
                    </div>
                    <div style={styles.userName}>{entry.username}</div>
                    <div style={styles.userStreaks}>
                      <span style={{ color: "#888888", fontSize: 13 }}>🔥 {entry.current_streak}</span>
                      <span style={{ color: "#444444", fontSize: 10, marginLeft: 8 }}>BEST: {entry.longest_streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <aside style={isMobile ? styles.mobileLeftColumn : styles.leftColumn}>
        {!isMobile ? (
          <>
            <div style={styles.rulesTitle}>HOW TO PLAY</div>
            <RulesList />
            <div style={{ height: 1, background: "#1a1a1a", margin: "24px 0" }} />
            <div style={styles.streakSection}>
              <div style={styles.streakLabel}>YOUR STREAK</div>
              <div style={styles.streakValue}>
                {streak > 0 && "🔥 "}{streak} days
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.streakSection}>
              <div style={styles.streakLabel}>YOUR STREAK</div>
              <div style={styles.streakValue}>
                {streak > 0 && "🔥 "}{streak} days
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <button 
                style={styles.mobileRulesToggle} 
                onClick={() => setShowRules(!showRules)}
              >
                HOW TO PLAY {showRules ? "↑" : "↓"}
              </button>
              {showRules && <div style={{ marginTop: 20 }}><RulesList /></div>}
            </div>
          </>
        )}
      </aside>

      <main style={styles.rightColumn}>
        <header style={styles.innerTopBar}>
          <button style={styles.navBtn} onClick={fetchLeaderboard}>LEADERBOARD</button>
          <button style={styles.logoutBtn} onClick={onLogout}>LOGOUT</button>
        </header>

        <div style={styles.heroSection}>
          <h1 style={styles.mainTitle}>Cardle</h1>
          <p style={styles.dateText}>{challenge.date}</p>
        </div>

        <div style={styles.tableArea}>
          <div style={styles.handSection}>
            <span style={styles.sectionLabel}>YOUR HAND</span>
            <div style={styles.cardRow}>
              {challenge.cards.map((c) => <PlayingCard key={c.code} card={c} />)}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={styles.scoreText}>
                {bust ? <span style={styles.bustText}>bust</span> : `Score ${challenge.score}`}
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
              {revealedCards >= result.dealer_cards.length && (
                <>
                  <div style={{ 
                    ...styles.resultStatus, 
                    color: result.correct ? "#4caf50" : "#e57373" 
                  }}>
                    {result.correct ? "CORRECT" : "WRONG"}
                  </div>
                  <p style={styles.resultMessage}>{result.message}</p>
                  <div style={styles.streakUpdate}>
                    {result.streak > 0 ? `🔥 ${result.streak} DAY STREAK` : "STREAK RESET"}
                  </div>

                  <div style={{ height: 1, background: "#1a1a1a", margin: "24px 0" }} />
                </>
              )}

              <span style={styles.sectionLabel}>DEALER'S HAND</span>
              <div style={styles.cardRow}>
                {result.dealer_cards.slice(0, revealedCards).map((c) => (
                  <div key={c.code} style={{ animation: "cardReveal 0.3s ease forwards" }}>
                    <PlayingCard card={c} />
                  </div>
                ))}
              </div>

              <div style={{ 
                fontSize: 14, 
                color: calcScore(result.dealer_cards.slice(0, revealedCards)) > 21 ? "#e57373" : "#666",
                marginBottom: 8
              }}>
                Dealer: {calcScore(result.dealer_cards.slice(0, revealedCards))}
              </div>

              {revealedCards < result.dealer_cards.length ? (
                <div style={{ color: "#444", fontSize: 12 }}>drawing...</div>
              ) : (
                <div style={styles.summaryRow}>
                  <div style={styles.summaryText}>
                    You {result.player_score > 21 ? "bust" : result.player_score}
                    {"  •  "}
                    Dealer {result.dealer_score > 21 ? "bust" : result.dealer_score}
                  </div>
                </div>
              )}
            </div>
          )}

          {alreadyPlayed && !result && (
            <div style={styles.alreadyPlayedBox}>
              Already played today. Come back tomorrow.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    background: "#0a0a0a",
    maxWidth: 1100,
    margin: "0 auto",
  },
  leftColumn: {
    position: "sticky",
    top: 40,
    alignSelf: "flex-start",
  },
  mobileLeftColumn: {
    width: "100%",
    marginBottom: 24,
  },
  rightColumn: {
    width: "100%",
  },
  rulesTitle: {
    fontSize: 10,
    letterSpacing: "0.15em",
    color: "#333333",
    marginBottom: 24,
    fontWeight: 500,
  },
  rulesList: {
    display: "flex",
    flexDirection: "column",
  },
  ruleItem: {
    marginBottom: 20,
  },
  ruleLabel: {
    color: "#555555",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: 500,
  },
  ruleDesc: {
    color: "#888888",
    fontSize: 13,
    lineHeight: 1.6,
  },
  streakSection: {
    marginTop: 0,
  },
  streakLabel: {
    color: "#555555",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: 500,
  },
  streakValue: {
    color: "#e8e8e8",
    fontSize: 20,
    fontWeight: 600,
  },
  mobileRulesToggle: {
    background: "transparent",
    border: "none",
    color: "#333333",
    fontSize: 10,
    letterSpacing: "0.15em",
    fontWeight: 500,
    padding: 0,
  },
  innerTopBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 16,
    padding: "0 0 20px 0",
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
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 4,
    padding: 40,
    textAlign: "center",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid #222",
    borderTopColor: "#e8e8e8",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#666",
    fontSize: 12,
    marginTop: 16,
    fontWeight: 500,
    letterSpacing: "0.05em",
  },
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#444",
    fontSize: 14,
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "#555555",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.1em",
  },
  logoutBtn: {
    background: "transparent",
    border: "none",
    color: "#555555",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.1em",
  },
  heroSection: {
    textAlign: "center",
    margin: "0 0 40px 0",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#e8e8e8",
  },
  dateText: {
    color: "#333333",
    fontSize: 12,
    marginTop: 8,
  },
  tableArea: {
    position: "relative",
    padding: "0",
    maxWidth: 480,
    margin: "0 auto",
  },
  handSection: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 4,
    padding: "24px",
    marginBottom: 32,
  },
  sectionLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 500,
    color: "#444444",
    letterSpacing: "0.15em",
    textAlign: "center",
    marginBottom: 20,
  },
  cardRow: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  playingCard: {
    width: 68,
    height: 96,
    background: "#fff",
    borderRadius: 8,
    position: "relative",
    border: "1px solid #d0d0d0",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    color: "#000",
  },
  cardCorner: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    lineHeight: 1,
  },
  cardCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 28,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 500,
    color: "#666666",
  },
  bustText: {
    fontSize: 12,
    color: "#e57373",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  actionSection: {
    textAlign: "center",
  },
  bustMessage: {
    color: "#444",
    fontSize: 14,
    marginBottom: 20,
  },
  revealBtn: {
    width: "100%",
    height: 44,
    borderRadius: 4,
    background: "#1a1a1a",
    color: "#e8e8e8",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.08em",
    border: "1px solid #222",
  },
  questionText: {
    fontSize: 16,
    fontWeight: 400,
    marginBottom: 24,
    color: "#aaaaaa",
  },
  buttonStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  yesBtn: {
    width: "100%",
    height: 44,
    borderRadius: 4,
    background: "#1a3a1a",
    color: "#4caf50",
    border: "1px solid #2d5a2d",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.08em",
  },
  noBtn: {
    width: "100%",
    height: 44,
    borderRadius: 4,
    background: "#3a1a1a",
    color: "#e57373",
    border: "1px solid #5a2d2d",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.08em",
  },
  resultSection: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 4,
    padding: "24px",
    textAlign: "center",
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  resultMessage: {
    color: "#666",
    fontSize: 14,
    margin: "0 0 12px 0",
  },
  streakUpdate: {
    fontSize: 11,
    fontWeight: 600,
    color: "#444",
    letterSpacing: "0.05em",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: 8,
  },
  summaryText: {
    fontSize: 13,
    color: "#666666",
  },
  alreadyPlayedBox: {
    textAlign: "center",
    color: "#444",
    fontSize: 14,
    padding: "40px 0",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.88)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  overlayCard: {
    width: "100%",
    maxWidth: 400,
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 4,
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
    color: "#444",
    fontSize: 16,
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 24px 0",
    textAlign: "center",
    color: "#e8e8e8",
  },
  overlayMessage: {
    textAlign: "center",
    color: "#444",
    fontSize: 13,
    padding: "20px 0",
  },
  leaderboardList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  leaderboardItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #1a1a1a",
  },
  rank: {
    fontSize: 13,
    fontWeight: 600,
    width: 24,
  },
  userName: {
    flex: 1,
    fontSize: 13,
    color: "#e8e8e8",
  },
  userStreaks: {
    textAlign: "right",
  },
};

