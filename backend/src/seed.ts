// backend/src/seed.ts
import "dotenv/config";
import mongoose from "mongoose";
import { Category } from "./models/categories.model";

const categories = [
  "Electronics",
  "Vehicles",
  "Fashion",
  "Furniture",
  "Books",
  "Gaming",
  "Services",
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!)
  console.log("Connected to MongoDB");

  for (const name of categories) {
    await Category.findOneAndUpdate(
      { name },
      { name },
      { upsert: true }
    );
  }

  console.log("Categories seeded:", categories);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});