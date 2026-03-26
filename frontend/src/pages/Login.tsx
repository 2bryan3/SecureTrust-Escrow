import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ToastPortal } from "../components/ToastPortal";
import "../styles/Auth.css";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { refreshUser } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setToast({ message: "Welcome back!", type: "success" });
      await refreshUser();
      const to = loc.state?.from?.pathname ?? "/";
      nav(to, { replace: true });
    } catch (e: any) {
      setToast({ message: e.message ?? "Login failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />

      <div className="auth-page">
        <form onSubmit={onSubmit} className="auth-card">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue</p>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="auth-password-wrap">
            <input
              placeholder="Password"
              type={hidePassword ? "password" : "text"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setHidePassword(prev => !prev)}
            >
              {hidePassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <span onClick={() => nav("/signup")}>Sign up</span>
          </p>
        </form>
      </div>
    </>
  );
}