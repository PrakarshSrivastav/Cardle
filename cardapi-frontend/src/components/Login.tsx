import { useState, useEffect } from "react";
import api from "../api";

interface Props {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Cardle";
  }, []);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", { username, email, password });
      }
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);
      const res = await api.post("/auth/login", form);
      onLogin(res.data.access_token);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <style>{`
        body { 
          margin: 0; 
          background: #0a0a0a; 
          font-family: 'Inter', sans-serif;
          color: #e8e8e8;
        }
        * { box-sizing: border-box; }
        input:focus { border-color: #444444 !important; outline: none; }
        button { transition: all 0.2s ease; cursor: pointer; }
        button:hover { opacity: 0.85; }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
      
      <div style={styles.card}>
        <div style={styles.logo}>🃏</div>
        <h1 style={styles.title}>Cardle</h1>
        <p style={styles.subtitle}>One hand, one guess, every day.</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
            onClick={() => setMode("login")}
          >
            LOGIN
          </button>
          <button
            style={{ ...styles.tab, ...(mode === "register" ? styles.tabActive : {}) }}
            onClick={() => setMode("register")}
          >
            REGISTER
          </button>
        </div>

        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {mode === "register" && (
            <input
              style={styles.input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "..." : mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
  },
  card: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: 4,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  logo: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    margin: 0,
    color: "#e8e8e8",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#444444",
    textAlign: "center",
    margin: "0 0 24px 0",
    fontSize: 12,
    letterSpacing: "0.05em",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #222",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "transparent",
    color: "#444444",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  tabActive: {
    color: "#e8e8e8",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: "10px 14px",
    borderRadius: 3,
    border: "1px solid #222222",
    background: "#0a0a0a",
    color: "#e8e8e8",
    fontSize: 14,
    transition: "border-color 0.2s",
  },
  submitBtn: {
    height: 40,
    borderRadius: 3,
    background: "#e8e8e8",
    color: "#0a0a0a",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.08em",
    border: "none",
    marginTop: 8,
  },
  error: {
    color: "#e57373",
    fontSize: 12,
    margin: 0,
    textAlign: "center",
  },
};

