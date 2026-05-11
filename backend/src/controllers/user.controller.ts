import { Request, Response } from "express";
import { User } from "../models/user.model";
import { UserUpdateSchema } from "../schemas/user.schema";
import bcrypt from "bcryptjs";
import { Listing } from "../models/listing.model";
import { ListingImage } from "../models/listingImage.model";
import { ListingCategory } from "../models/listingCategory.model";
import { ListingFavorites } from "../models/listingFavorite.model";
import { ListingReport } from "../models/listingReport.model";
import { geocodeAddress } from "../utils/geocodeAddress";

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updateData = UserUpdateSchema.parse(req.body);

    if (updateData.email) {
      const existingEmail = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    if (updateData.address) {
      const addressInput = updateData.address.trim();
     
      const addressParts = addressInput.split(",").map(p => p.trim());
      if (addressParts.length < 2) {
        return res.status(400).json({ message: "Invalid address format. Please use: Street, City, State" });
      }
      
      let geo;
      try {
        geo = await geocodeAddress(updateData.address);
      } catch (error: any) {
        return res.status(400).json({ message: "Invalid address, please check the address and try again." });
      }

      if (!geo || !geo.street || !geo.city || !geo.state) {
        return res.status(400).json({ message: "Invalid address, please enter a full street address including city and state." });
      }
      
      updateData.location = {
        type: "Point",
        coordinates: [geo.lon, geo.lat],
      };

      updateData.street = geo.street;
      updateData.city = geo.city;
      updateData.state = geo.state;
      console.log(geo.street);
      console.log(geo.city);
      console.log(geo.state);
    }

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

        return res.status(200).json({success: "true"});
    } catch (error: any){
      res.status(500).json({message: error.message});
    }
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("firstName lastName username email role createdAt isBanned")
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      users.map(async (u) => {
        const listingCount = await Listing.countDocuments({ userID: u._id });
        return { ...u, listingCount };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
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