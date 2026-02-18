import type { ListingData } from "../types/listing.types";

export const sampleListings: ListingData[] = Array.from({ length: 20 }, (_, i) => ({
  _id: `listing-${i + 1}`,

  title: `Sample Item ${i + 1}`,

  description: "This is a dummy listing used for prototype purposes.",

  price: Math.floor(Math.random() * 200) + 25,

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  categories: ["Electronics"],

  images: [
    `https://picsum.photos/seed/item${i + 1}/600/400`
  ],

  isSold: Math.random() < 0.25,

  user: {
    _id: `user-${(i % 5) + 1}`, // simulate multiple users
    firstName: "Demo",
    lastName: `User${(i % 5) + 1}`,
    username: `demo_user_${(i % 5) + 1}`,
    email: `demo${(i % 5) + 1}@email.com`,
    avatar: `https://i.pravatar.cc/150?img=${(i % 10) + 1}`
  }
}));