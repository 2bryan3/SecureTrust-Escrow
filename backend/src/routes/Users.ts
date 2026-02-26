import { Router } from "express";
import { UserModel } from "../models/User";

const router = Router();

// test route: creates a user (NOT for production, just to test DB)
router.post("/test-create-user", async (req, res) => {
  const { email, passwordHash, name } = req.body;

  const user = await UserModel.create({ email, passwordHash, name });
  res.json({ id: user._id, email: user.email, name: user.name });
});

export default router;