import jwt from "jsonwebtoken";
import {User} from "../models/user.model";
import {Request, Response, NextFunction} from "express";

const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    console.log("protectedRoute hit on path:", req.path, req.originalUrl);
    const token = req.cookies.jwt;

    if (!token) {
        console.log("no token")
        return res.status(401).json({message: "Not authenticated"})
    }
    console.log("token")
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {userId: string};

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isBanned) return res.status(403).json({ message: "Account banned" });
		
        console.log("Sucessful authenticated on protect route")

        req.user = user as any;
        next();
    } catch (error:any) {
        console.log(error.message)
        return res.status(401).json({ message: "Invalid token"})
    }

};

export default protectRoute;