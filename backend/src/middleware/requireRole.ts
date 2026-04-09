// backend/src/middleware/requireRole.ts
import { Request, Response, NextFunction } from "express";

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    console.log("requireRole — user role:", user?.role, "required:", roles);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };