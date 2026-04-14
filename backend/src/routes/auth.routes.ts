import express, {Request, Response} from "express";
import {signup, logout, authenticate, createAdmin, login} from "../controllers/auth.controller"

const authRouter = express.Router();

authRouter.post("/signup", signup);

authRouter.post("/login", login);

authRouter.post("/logout", logout);

authRouter.post("/adminSignup", createAdmin);

authRouter.get("/me", authenticate, (req: Request, res: Response) => {
    console.log("success auth")
    res.json({user: req.user });
})

export default authRouter;