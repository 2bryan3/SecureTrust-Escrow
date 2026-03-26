import { z } from "zod";
import { Types } from "mongoose";

export const ListingImageInputSchema = z.object({
  listingID: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid listingID" }),
  image: z
    .string(),
});

export type ListingImageInput = z.infer<typeof ListingImageInputSchema>;

export const ListingCategoryDBSchema = ListingImageInputSchema.extend({
    _id: z.instanceof(Types.ObjectId)
  });
  
export type ListingImage = z.infer<typeof ListingCategoryDBSchema>;