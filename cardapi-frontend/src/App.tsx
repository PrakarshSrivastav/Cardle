import { useState, useEffect } from "react";
import Login from "./components/Login";
import Game from "./components/Game";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  return (
    <div>
      {token ? (
        <Game onLogout={() => setToken(null)} />
      ) : (
        <Login onLogin={(t) => setToken(t)} />
      )}
    </div>
  );
}
