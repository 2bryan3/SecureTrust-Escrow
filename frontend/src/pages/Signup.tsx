import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ToastPortal } from "../components/ToastPortal";
import "../styles/Auth.css";

export default function Signup() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const {signup} = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    if (password.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, firstName, lastName);
      setToast({ message: "Account created!", type: "success" });
      nav("/", { replace: true });
    } catch (e: any) {
      setToast({ message: e.message ?? "Signup failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />

      <div className="auth-page">
        <form onSubmit={onSubmit} className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join and start trading safely</p>

          <div className="auth-row">
            <input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

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

          <div className="auth-password-wrap">
            <input
              placeholder="Confirm password"
              type={hideConfirmPassword ? "password" : "text"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setHideConfirmPassword(prev => !prev)}
            >
              {hideConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <span onClick={() => nav("/login")}>Sign in</span>
          </p>
        </form>
      </div>
    </>
  );
}