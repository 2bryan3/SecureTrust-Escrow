import { z } from "zod";
import { Types } from "mongoose";

export const CategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export type CategoryInput = z.infer<typeof CategoryInputSchema>;

export const CategoryDBSchema = CategoryInputSchema.extend({
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
  
export type Category = z.infer<typeof CategoryDBSchema>;