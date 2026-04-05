import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Request, Response, NextFunction } from "express";

const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select("-password");
    if (user) req.user = user as any;
  } catch {
    // invalid or expired token — just continue as guest
  }
  next();
};

export default optionalAuth;