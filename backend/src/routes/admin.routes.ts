// backend/src/routes/admin.router.ts
import { Router } from "express";
import protectRoute from "../utils/protectRoute";
import { requireRole } from "../middleware/requireRole";
import {
  getStats,
  getAdminUsers,
  updateUserStatus,
  updateUserRole,
  getAdminLogs,
} from "../controllers/admin.controller";

const router = Router();

// All admin routes require auth + admin role
router.use(protectRoute, requireRole("admin"));

router.get("/stats",                        getStats);
router.get("/users",                        getAdminUsers);
router.patch("/users/:id/status",           updateUserStatus);
router.patch("/users/:id/role",             updateUserRole);
router.get("/logs",                         getAdminLogs);

export default router;