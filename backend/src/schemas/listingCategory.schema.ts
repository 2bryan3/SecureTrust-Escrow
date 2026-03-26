import { z } from "zod";
import { Types } from "mongoose";

export const ListingCategoryInputSchema = z.object({
  listingID: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid listingID" }),
  categoryID: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid categoryID" }),
});

export type ListingCategoryInput = z.infer<typeof ListingCategoryInputSchema>;

export const ListingCategoryDBSchema = ListingCategoryInputSchema.extend({
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
  
export type ListingCategory = z.infer<typeof ListingCategoryDBSchema>;