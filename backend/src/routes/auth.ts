import { Router } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../models/User";

const router = Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };

  // validate required fields
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // check if user exists
  const existing = await UserModel.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  // hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // create user with avatar empty string for now
  const user = await UserModel.create({
    email,
    passwordHash,
    firstName,
    lastName,
    avatar: "",
  });

  // return user info
  return res.status(201).json({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
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

  return res.json({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

// POST /auth/logout
router.post("/logout", (_req, res) => {
  return res.json({ ok: true });
});

// GET /auth/me
router.get("/me", async (req, res) => {
  // return null for now; sessions/JWT to be implemented later
  return res.status(401).json({ user: null });
});

export default router;