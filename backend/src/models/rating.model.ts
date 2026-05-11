import mongoose, { InferSchemaType } from "mongoose";

const RatingSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    reviewerId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:          { type: String, enum: ["buyer", "seller"], required: true },
    rating:        { type: Number, required: true, min: 1, max: 5 },
    note:          { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

RatingSchema.index({ transactionId: 1, reviewerId: 1 }, { unique: true });

export type RatingType = InferSchemaType<typeof RatingSchema>;
export const Rating = mongoose.model("Rating", RatingSchema);