import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css"

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

 async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setErr(null);

  if (password !== confirmPassword) {
    setErr("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    setErr("Password must be at least 6 characters");
    return;
  }

  try {
    await signup(email, password, firstName, lastName); // send separately
    nav("/", { replace: true });
  } catch (e: any) {
    setErr(e.message ?? "Signup failed");
  }
}

  return (
    <div className="auth-page">
      <form onSubmit={onSubmit} className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join and start trading safely</p>

        {err && <p className="auth-error">{err}</p>}

        <div className="auth-row">
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

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

        <input
          placeholder="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" className="primary-btn">
          Create Account
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <span onClick={() => nav("/login")}>Sign in</span>
        </p>
      </form>
    </div>
  );
}