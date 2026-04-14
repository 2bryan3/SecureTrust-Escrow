// backend/scripts/migrateUser.ts
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../src/models/user.model";

dotenv.config();

async function migrateUsers() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri, {});
  console.log("Connected to MongoDB for migration");

  const users = await User.find({});

  for (const user of users) {
    // Cast user to include optional 'name' for migration purposes
    const u = user as typeof user & { name?: string };

    // Skip if user already has firstName and lastName
    if (u.firstName && u.lastName) continue;

    // If there’s a legacy 'name' field, split it
    if (u.name) {
      const parts = u.name.trim().split(" ");
      u.firstName = parts[0];
      u.lastName = parts.slice(1).join(" ") || "";
      await u.save();
      console.log(`Updated user ${u.email}: ${u.firstName} ${u.lastName}`);
    }
  }

  console.log("Migration finished!");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

// Run the migration
migrateUsers().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});