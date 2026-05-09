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
    // --- Seller obligations ---
    packageImageUrl: { type: String, default: null },       // uploaded photo URL
    trackingNumber:  { type: String, default: null },
    trackingCarrier: { type: String, default: null },       // e.g. "UPS", "FedEx"
    sellerSubmittedAt: { type: Date, default: null },

    // --- Buyer obligations ---
    buyerFundsDeposited: { type: Boolean, default: false },
    buyerDepositedAt:    { type: Date,    default: null },
    depositTxRef:        { type: String,  default: null },  // payment-processor reference

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
    // Buyer must explicitly confirm receipt
    buyerConfirmed:     { type: Boolean, default: false },
    buyerConfirmedAt:   { type: Date,    default: null },
    buyerConfirmNote:   { type: String,  default: null }, // optional message from buyer

    // Fund-release record
    fundsReleasedAt:    { type: Date,   default: null },
    releaseTxRef:       { type: String, default: null }, // payment-processor reference

    status: {
      type: String,
      enum: ["locked", "awaiting_confirmation", "confirmed", "funds_released"],
      default: "locked",       // locked until milestone 1 is "completed"
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
    // --- Parties ---
    buyerId:  { type: Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Types.ObjectId, ref: "User", required: true },

    // --- Listing reference ---
    listingId: { type: Types.ObjectId, ref: "Listing", required: true },

    // --- Financials ---
    amount:       { type: Number, required: true, min: 0 },  // total agreed price
    escrowAmount: { type: Number, default: 0,     min: 0 },  // what's currently held
    currency:     { type: String, default: "USD" },

    // --- Milestones ---
    milestone1: { type: milestone1Schema, default: () => ({}) },
    milestone2: { type: milestone2Schema, default: () => ({}) },
    milestone3: { type: milestone3Schema, default: () => ({}) },

    // --- Top-level status ---
    status: {
      type: String,
      enum: [
        "initiated",        // transaction created, nothing done yet
        "milestone1",       // working through milestone 1
        "milestone2",       // milestone 1 done, working through milestone 2
        "milestone3",       // milestone 2 done, working through milestone 3 (returns/refunds)
        "completed",        // funds released, transaction closed
        "disputed",         // dispute raised (for Phase 2)
        "refunded",         // buyer refunded (for Phase 2)
        "cancelled",        // cancelled before any funds moved
      ],
      default: "initiated",
    },

    // Who initiated (either party can start)
    initiatedBy: {
      type: String,
      enum: ["buyer", "seller"],
      required: true,
    },

    // Optional agreed-upon notes / terms
    terms: { type: String, default: null },

    // --- Stripe ---
    stripePaymentIntentId: { type: String, default: null }, // PaymentIntent ID for escrow

    // Soft-delete / audit
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["buyer", "seller", "admin", null], default: null },
  },
  { timestamps: true }
);

// Index for fast user-based lookups
transactionSchema.index({ buyerId: 1, status: 1 });
transactionSchema.index({ sellerId: 1, status: 1 });
transactionSchema.index({ listingId: 1 });

export type Transaction = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = mongoose.model("Transaction", transactionSchema);