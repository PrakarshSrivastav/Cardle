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
          color: white;
        }
        * { box-sizing: border-box; }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
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
            {loading ? "..." : mode === "login" ? "Login" : "Create Account"}
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
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 16,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  },
  logo: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    textAlign: "center",
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#888",
    textAlign: "center",
    margin: "0 0 24px 0",
    fontSize: 14,
    fontWeight: 500,
  },
  tabs: {
    display: "flex",
    background: "#000",
    padding: 4,
    borderRadius: 10,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#666",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#1a1a1a",
    color: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: "14px 16px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
  },
  submitBtn: {
    padding: "16px",
    borderRadius: 8,
    background: "#fff",
    color: "#000",
    fontWeight: 800,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
    marginTop: 8,
    transition: "all 0.2s",
  },
  error: {
    color: "#e74c3c",
    fontSize: 13,
    margin: 0,
    textAlign: "center",
    fontWeight: 600,
  },
};
