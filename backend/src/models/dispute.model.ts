import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true
  },
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
  escalationMessage: {
    type: String,
    default: null
  },
  evidence: {
    type: [String], // Array of URLs or file paths
    default: []
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Under Review", "Resolved", "Refunded", "Dismissed"],
    default: "Pending"
  },
  decisionNotes: {
    type: String,
    default: null
  },
}, { versionKey: false, timestamps: true, collection: "disputes" });

export const Dispute = mongoose.model("Dispute", DisputeSchema);