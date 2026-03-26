import jwt from "jsonwebtoken";
import { Response } from "express";
import { Types } from "mongoose";


const generateTokenAndSetCookie = (userId: Types.ObjectId, res: Response) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET!, {
        expiresIn: "5d"
    });

    res.cookie("jwt", token, {
        maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days in ms
        httpOnly: true,
        sameSite: "lax",
        secure: false,
    });
}

export default generateTokenAndSetCookie;