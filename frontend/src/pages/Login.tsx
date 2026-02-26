import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Auth.css"

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const loc = useLocation() as any;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      const to = loc.state?.from?.pathname ?? "/";
      nav(to, { replace: true });
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    }
  }

  return (
  <div className="auth-page">
    <form onSubmit={onSubmit} className="auth-card">
      <h1>Welcome Back</h1>
      <p className="auth-subtitle">Sign in to continue</p>

      {err && <p className="auth-error">{err}</p>}

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" className="primary-btn">
        Sign In
      </button>
      <p className="auth-switch">
        Don’t have an account? <span onClick={() => nav("/signup")}>Sign up</span>
      </p>
    </form>
  </div>
);
}