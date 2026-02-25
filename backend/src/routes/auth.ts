import { Router } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../models/User";

const router = Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existing = await UserModel.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({ email, passwordHash, name });

  // For now, just return user info (we’ll add cookies/sessions next)
  return res.status(201).json({ id: user._id, email: user.email, name: user.name });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await UserModel.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  // For now, just return user info (we’ll add cookies/sessions next)
  return res.json({ id: user._id, email: user.email, name: user.name });
});

// POST /auth/logout
router.post("/logout", (_req, res) => {
  // When you add sessions, you’ll destroy the session here
  return res.json({ ok: true });
});

// GET /auth/me
router.get("/me", async (req, res) => {
  // Since you don't have sessions yet, just return null
  // This will be properly implemented when you add sessions/JWT
  return res.status(401).json({ user: null });
});

export default router;