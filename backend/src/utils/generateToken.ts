import jwt from "jsonwebtoken";
import { Response } from "express";
import { Types } from "mongoose";


const generateTokenAndSetCookie = (userId: Types.ObjectId, res: Response) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET!, {
        expiresIn: "7d"
    });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: "strict",
        secure: false,
    });
}

export default generateTokenAndSetCookie;