import { Router } from "express";
import { UserModel } from "../models/User";
import { create } from "node:domain";

const router = Router();

// test route: creates a user (NOT for production)
router.post("/test-create-user", async (req, res) => {
  const { email, passwordHash, firstName, lastName } = req.body;

  if (!email || !passwordHash || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await UserModel.create({ email, passwordHash, firstName, lastName });
  res.json({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

export default router;