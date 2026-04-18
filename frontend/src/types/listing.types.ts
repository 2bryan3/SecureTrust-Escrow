// frontend/src/types/listing.types.ts

export interface ListingUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ListingData {
  _id: string;
  title: string;
  description: string;
  price: number;
  categories: string[];
  images: string[];       // base64 strings from ListingImage docs
  user: ListingUser;   
  isSold: boolean;
  deliveryMethod: "shipping" | "local_pickup";
  createdAt: string;
  updatedAt: string;
  city: string;
  state: string;
  isFavorited?: boolean;
  favoriteCount?: number;
  attributes?: Record<string, string>;
}

export interface ListingInput {
  title: string;
  description: string;
  price: number;
  categories: string[];
  images: string[];
  deliveryMethod: "shipping" | "local_pickup";
  attributes?: Record<string, string>;
}