import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI in .env");

  // Optional but nice: stricter querying
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log("✅ Connected to MongoDB");
}