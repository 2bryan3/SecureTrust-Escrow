import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
  listingID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },
  buyerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sellerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Under Review", "Resolved", "Refunded", "Dismissed"],
    default: "Pending"
  }
}, { versionKey: false, timestamps: true, collection: "disputes" });

export const Dispute = mongoose.model("Dispute", DisputeSchema);