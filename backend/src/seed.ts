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
  "Collectibles & Art",
  "Home & Garden",
  "Toys & Hobbies",
  "Sporting Goods",
  "Health & Beauty",
  "Jewelry & Watches",
  "Baby Essentials",
  "Pet Supplies",
  "Musical Instruments",
  "Tools & Hardware",
  "Livestock",    
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

// This file is meant to be run once to populate the database with initial categories. 
// Run with `npx ts-node src/seed.ts` from the backend directory. 
// It will connect to MongoDB, insert the predefined categories if they don't already exist, and then disconnect.