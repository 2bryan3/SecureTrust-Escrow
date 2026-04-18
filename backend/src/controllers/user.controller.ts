import { Request, Response } from "express";
import { User } from "../models/user.model"; // Adjust path to match your setup
import { UserUpdateSchema } from "../schemas/user.schema"; // or wherever you put it
import bcrypt from "bcryptjs";
import { Listing } from "../models/listing.model";
import { ListingImage } from "../models/listingImage.model";
import { ListingCategory } from "../models/listingCategory.model";
import { ListingFavorites } from "../models/listingFavorite.model";
//import Message from "../models/messages.model.js";
//import Conversation from "../models/conversations.model.js";
import { ListingReport } from "../models/listingReport.model";
import { geocodeAddress } from "../utils/geocodeAddress";

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate input using Zod
    const updateData = UserUpdateSchema.parse(req.body);

    // Check for unique username/email if changed
    // if (updateData.username) {
    //   const existingUsername = await User.findOne({ username: updateData.username, _id: { $ne: userId } });
    //   if (existingUsername) {
    //     return res.status(400).json({ message: "Username is already taken" });
    //   }
    // }

    if (updateData.email) {
      const existingEmail = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }

    // If password is provided, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Set address, location, city, and state
    if (updateData.address) {
      const geo = await geocodeAddress(updateData.address);

      if (!geo) {
        return res.status(400).json({ message: "Invalid address" });
      }
      updateData.location = {
        type: "Point",
        coordinates: [geo.lon, geo.lat],
      };

      updateData.city = geo.city;
      updateData.state = geo.state;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated successfully" });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Failed to update user" });
  }
};

// user/ban/:id
export const banUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id

        if (req.user?.role !== "admin"){
            return res.status(401).json({message: "Not Authorized"})
        }
        const user = await User.findById(id);
        if (user?.role === "admin") {
            return res.status(401).json({message: "You can not ban other administrators"})
        }
        await User.findByIdAndUpdate(
          id,
          {
            isBanned: true
          }
        );

        const docs = await Listing.find({ userID: id });
        await Listing.deleteMany({ userID: id });

        await Promise.all(
          docs.map(async (d) => {
            await ListingImage.deleteMany({ listingID: d._id })
            await ListingCategory.deleteMany({ listingID: d._id });
            await ListingReport.deleteMany({listingID: d._id});
          })
        );

        await ListingFavorites.deleteMany({ userID: id });

        // await Promise.all([
        //   ListingFavorites.deleteMany({userID: id}),
        //   Message.deleteMany({
        //     $or: [
        //       { senderID: id },
        //       { receiverID: id }
        //     ]
        //   }),
        //   Conversation.deleteMany({
        //     participants: id
        //   })
        // ]);

        return res.status(200).json({success: "true"});
    } catch (error: any){
      res.status(500).json({message: error.message});
    }
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("firstName lastName username email role createdAt status")
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      users.map(async (u) => {
        const listingCount = await Listing.countDocuments({ userID: u._id });
        return { ...u, status: u.status ?? "active", listingCount };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("firstName lastName email role status");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!["user", "mediator", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("firstName lastName email role status");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update role" });
  }
};