import { z } from "zod";
import { Types } from "mongoose";

const LocationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]) 
});

export const BaseUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username must be at least 1 characters long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    email: z.email("Invalid email address"),
    address: z.string().min(1, "Address is required").optional(),
    location: LocationSchema.optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    roleID: z
      .string()
      .refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid roleID (must be a valid ObjectId)",
      })
      .optional(),
      avatar: z.string().nullish(),
      role: z.enum(["user", "mediator", "admin"]).default("user")
  });

export const UserInputSchema = BaseUserSchema.omit({ roleID: true, avatar: true }).extend({
roleID: BaseUserSchema.shape.roleID.optional(), 
});

export type UserInput = z.infer<typeof UserInputSchema>;


export const UserDBSchema = BaseUserSchema.omit({ password: true, roleID: true }).extend({
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const UserLoginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string("Password required")
})


export type User = z.infer<typeof UserDBSchema>;

export const SignupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .transform((data) => ({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    username: data.username,
  }))
  .pipe(UserInputSchema);

// For PUT /user/update
export const UserUpdateSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    avatar: z.string().optional(),
    address: z.string().optional(),
    location: LocationSchema.optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .refine((data) => data.password === undefined || data.password.length >= 6, {
    message: "Password must be at least 6 characters",
    path: ["password"],
  });
  