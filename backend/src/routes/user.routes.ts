import express from "express";
import { banUser, updateUser } from "../controllers/user.controller";
import protectRoute from "../utils/protectRoute";

const router = express.Router();

router.put("/update", protectRoute, updateUser);

router.post("/ban/:id", protectRoute, banUser)

export default router;