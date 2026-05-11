// backend/src/models/Transaction.ts
import mongoose, { InferSchemaType, Types } from "mongoose";

/**
 * Milestone 1 — "Ship It"
 *   Seller: uploads package photo + tracking number
 *   Buyer:  deposits escrow funds
 *   Unlocks milestone 2 when BOTH sides are done.
 *
 * Milestone 2 — "Confirm Delivery"
 *   Buyer:  confirms they received what was agreed upon
 *   System: releases escrowed funds to seller
 */

const milestone1Schema = new mongoose.Schema(
  {
    packageImageUrl: { type: String, default: null },       
    trackingNumber:  { type: String, default: null },
    trackingCarrier: { type: String, default: null },       
    sellerSubmittedAt: { type: Date, default: null },

    buyerFundsDeposited: { type: Boolean, default: false },
    buyerDepositedAt:    { type: Date,    default: null },
    depositTxRef:        { type: String,  default: null },  

    // Milestone-level status
    status: {
      type: String,
      enum: ["pending", "seller_submitted", "buyer_funded", "completed"],
      default: "pending",
    },
  },
  { _id: false }
);

const milestone2Schema = new mongoose.Schema(
  {
    buyerConfirmed:     { type: Boolean, default: false },
    buyerConfirmedAt:   { type: Date,    default: null },
    buyerConfirmNote:   { type: String,  default: null }, 

    fundsReleasedAt:    { type: Date,   default: null },
    releaseTxRef:       { type: String, default: null },

    status: {
      type: String,
      enum: ["locked", "awaiting_confirmation", "confirmed", "funds_released"],
      default: "locked",       
    },
  },
  { _id: false }
);

const milestone3Schema = new mongoose.Schema(
  {
    returnImageUrl:       { type: String,  default: null },
    returnTrackingNumber: { type: String,  default: null },
    returnCarrier:        { type: String,  default: null },
    buyerShippedAt:       { type: Date,    default: null },
    sellerConfirmed:      { type: Boolean, default: false },
    sellerConfirmedAt:    { type: Date,    default: null },
    refundIssuedAt:       { type: Date,    default: null },
    refundTxRef:          { type: String,  default: null },
    status: {
      type: String,
      enum: ["locked", "awaiting_return", "buyer_shipped", "seller_confirmed", "refund_issued"],
      default: "locked",
    },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    buyerId:  { type: Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Types.ObjectId, ref: "User", required: true },

    listingId: { type: Types.ObjectId, ref: "Listing", required: true },

    amount:       { type: Number, required: true, min: 0 }, 
    escrowAmount: { type: Number, default: 0,     min: 0 }, 
    currency:     { type: String, default: "USD" },

    milestone1: { type: milestone1Schema, default: () => ({}) },
    milestone2: { type: milestone2Schema, default: () => ({}) },
    milestone3: { type: milestone3Schema, default: () => ({}) },

    status: {
      type: String,
      enum: [
        "initiated",        // transaction created, nothing done yet
        "milestone1",       // working through milestone 1
        "milestone2",       // milestone 1 done, working through milestone 2
        "milestone3",       // milestone 2 done, working through milestone 3 (returns/refunds)
        "completed",        // funds released, transaction closed
        "disputed",         // dispute raised 
        "refunded",         // buyer refunded 
        "cancelled",        // cancelled before any funds moved
      ],
      default: "initiated",
    },

    initiatedBy: {
      type: String,
      enum: ["buyer", "seller"],
      required: true,
    },

    terms: { type: String, default: null },

    // --- Stripe ---
    stripePaymentIntentId: { type: String, default: null }, 

    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["buyer", "seller", "admin", null], default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ buyerId: 1, status: 1 });
transactionSchema.index({ sellerId: 1, status: 1 });
transactionSchema.index({ listingId: 1 });

export type Transaction = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = mongoose.model("Transaction", transactionSchema);