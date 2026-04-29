import express from "express";
import { banUser, updateUser, getAllUsers, updateUserRole } from "../controllers/user.controller";
import protectRoute from "../utils/protectRoute";
import { requireRole } from "../middleware/requireRole";

const router = express.Router();

router.put("/update", protectRoute, updateUser);
router.post("/ban/:id", protectRoute, requireRole("admin"), banUser);
router.get("/all", protectRoute, requireRole("admin"), getAllUsers);
router.patch("/:id/role", protectRoute, requireRole("admin"), updateUserRole);

export default router;