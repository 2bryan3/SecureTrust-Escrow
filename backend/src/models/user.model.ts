// backend/src/models/user.model.ts
import mongoose, { InferSchemaType } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true },
    lastName:   { type: String, required: true },
    username:   { type: String, required: true },
    password:   { type: String, required: true },
    email:      { type: String, unique: true, required: true },
    role: { type: String, enum: ["user", "mediator", "admin"], default: "user" },
    isBanned:   { type: Boolean, default: false },
    avatar:     { type: String, default: "..." },
    funds:      { type: Number, default: 0 },
    status:      { type: String, enum: ["active", "suspended"], default: "active" },
    address:    { type: String },
    location:   {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lon, lat]
      }
    },
    street: String,
    city: String,
    state: String,
  },
  { timestamps: true, versionKey: false }
);
UserSchema.index({ location: "2dsphere" });
export type UserType = InferSchemaType<typeof UserSchema>;
export const User = mongoose.model("User", UserSchema);
