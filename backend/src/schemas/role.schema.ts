import { z } from "zod";
import { Types } from "mongoose";

export const RoleInputSchema = z.object({
  title: z.string().min(1, "Role title is required"),
});

export type RoleInput = z.infer<typeof RoleInputSchema>;

export const RoleDBSchema = RoleInputSchema.extend({
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
  
export type Role = z.infer<typeof RoleDBSchema>;