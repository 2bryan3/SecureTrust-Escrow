import {Request, Response, NextFunction} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { SignupSchema, UserLoginSchema } from "../schemas/user.schema";
import generateTokenAndSetCookie from "../utils/generateToken";


export const createAdmin = async (req: Request, res: Response) => {
    try {

        const userData = SignupSchema.parse(req.body);

        const existingUser = await User.findOne({
            $or: [
                { username: userData.username },
                { email: userData.email },
            ],
        });

        if (existingUser) {
            return res.status(400).json({ error: "Username or email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        userData.password = hashedPassword;

        userData.role = "admin";

        const newAdmin = new User(userData);
        await newAdmin.save();

        res.status(201).json({
            message: "Admin created successfully",
            _id: newAdmin._id,
            fullName: newAdmin.firstName + " " + newAdmin.lastName,
            username: newAdmin.username,
            email: newAdmin.email,
            avatar: newAdmin.avatar,
            role: newAdmin.role
        });
    } catch (error: any) {
        console.log("Error in createAdmin controller:", error);
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
};


export const signup = async (req: Request, res: Response) => {
    try {
        const body = {
            ...req.body,
            username: `${req.body.firstName[0]}${req.body.lastName[0]}`.toUpperCase(),
            confirmPassword: req.body.password, 
        };
    
        const userData = SignupSchema.parse(body);

        const existingUser = await User.findOne({
            $or: [
                { email: userData.email },
            ],
        });

        if (existingUser) {
            return res.status(400).json({ error: "Username or email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        userData.password = hashedPassword;

        const newUser = new User(userData);

        await newUser.save();

        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            username: newUser.username,
            email: newUser.email,
            avatar: newUser.avatar,
            role: newUser.role
        })

    } catch (error: any){
        console.log("Error in signup controller:", error);
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
}

export const login = async (req: Request, res: Response) => {
    try {

        const loginData = UserLoginSchema.parse(req.body);

        const user = await User.findOne({email: loginData.email})

        if (user?.isBanned){
            return res.status(400).json({error: "You have been Banned!"})
        }
        
        const isPasswordCorrect = await bcrypt.compare(loginData.password, user?.password || "")

        if (!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid username or password"})
        }


        generateTokenAndSetCookie(user._id, res);
        console.log("set token")

        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            addres: user.address,
            avatar: user.avatar,
            role: user.role
        })

    } catch (error: any) {
        console.log("Error occured in auth.controller.login", error.message);
        res.status(500).json({ error: "Internal Server Error" })
    }
}


export const logout = (_req: Request, res: Response) => {
    try {
        res.cookie("jwt", "", {maxAge: 0})
        res.status(200).json({ message: "Logged out successfully" });
	} catch (error: any) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
}

export const authenticate = async (req: Request, res: Response, next: NextFunction)  => {
    console.log("Authenticating")
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
        if (user.isBanned){
            return res.status(401).json({ message: "Banned user"})
        }
        console.log("Sucessful authenticated")
        req.user = user as any;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token"})
    }

}