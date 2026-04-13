// backend/src/routes/transaction.routes.ts
import { Router, Request, Response } from "express";
import { TransactionModel } from "../models/transaction.model";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { stripe } from "../utils/stripe";

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidId = (id: string) => Types.ObjectId.isValid(id);

/** Derive which role the requesting user plays in a transaction */
const getRole = (tx: any, userId: string): "buyer" | "seller" | null => {
  if (tx.buyerId.toString()  === userId) return "buyer";
  if (tx.sellerId.toString() === userId) return "seller";
  return null;
};

// ─── POST /transactions ──────────────────────────────────────────────────────
/**
 * Create a new transaction (either buyer or seller can initiate).
 * Body: { listingId, buyerId, sellerId, amount, initiatedBy, terms? }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { listingId, buyerId, sellerId, amount, initiatedBy, terms } = req.body;

    if (!listingId || !buyerId || !sellerId || !amount || !initiatedBy) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (!["buyer", "seller"].includes(initiatedBy)) {
      return res.status(400).json({ error: "initiatedBy must be 'buyer' or 'seller'." });
    }

    const tx = await TransactionModel.create({
      listingId,
      buyerId,
      sellerId,
      amount,
      initiatedBy,
      terms: terms ?? null,
      status: "milestone1",
    });

    return res.status(201).json({ transaction: tx });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /transactions/:id ───────────────────────────────────────────────────
/** Fetch a single transaction by ID */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid transaction ID." });

    const tx = await TransactionModel.findById(id)
      .populate("buyerId",  "firstName lastName email avatar")
      .populate("sellerId", "firstName lastName email avatar")
      .populate("listingId", "title images price");

    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    return res.json({ transaction: tx });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /transactions/user/:userId ─────────────────────────────────────────
/** Get all transactions where a user is buyer or seller */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    if (!isValidId(userId)) return res.status(400).json({ error: "Invalid user ID." });

    const txs = await TransactionModel.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("listingId", "title images price");

    return res.json({ transactions: txs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /transactions/:id/milestone1/seller ───────────────────────────────
/**
 * Seller submits package photo + tracking number for Milestone 1.
 * Body: { sellerId, packageImageUrl, trackingNumber, trackingCarrier? }
 */
router.patch("/:id/milestone1/seller", async (req: Request, res: Response) => {
  try {
    const tx = await TransactionModel.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    if (tx.status !== "milestone1") {
      return res.status(400).json({ error: "Transaction is not in milestone 1." });
    }

    const { sellerId, packageImageUrl, trackingNumber, trackingCarrier } = req.body;

    if (getRole(tx, sellerId) !== "seller") {
      return res.status(403).json({ error: "Only the seller can submit shipping info." });
    }
    if (!packageImageUrl || !trackingNumber) {
      return res.status(400).json({ error: "packageImageUrl and trackingNumber are required." });
    }

    tx.milestone1.packageImageUrl  = packageImageUrl;
    tx.milestone1.trackingNumber   = trackingNumber;
    tx.milestone1.trackingCarrier  = trackingCarrier ?? null;
    tx.milestone1.sellerSubmittedAt = new Date();

    // Advance milestone1 status
    const buyerDone = tx.milestone1.buyerFundsDeposited;
    tx.milestone1.status = buyerDone ? "completed" : "seller_submitted";

    // If buyer already funded, move to milestone 2
    if (buyerDone) {
      tx.status = "milestone2";
      tx.milestone2.status = "awaiting_confirmation";
    }

    await tx.save();
    return res.json({ transaction: tx });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /transactions/:id/milestone1/buyer ────────────────────────────────
/**
 * Buyer confirms their deposit for Milestone 1 after completing Stripe payment.
 * The frontend calls POST /payment/create-payment-intent first, confirms the card
 * via Stripe.js, then calls this endpoint with the resulting paymentIntentId.
 *
 * Body: { buyerId, paymentIntentId }
 */
router.patch("/:id/milestone1/buyer", async (req: Request, res: Response) => {
  try {
    const tx = await TransactionModel.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    if (tx.status !== "milestone1") {
      return res.status(400).json({ error: "Transaction is not in milestone 1." });
    }

    const { buyerId, paymentIntentId } = req.body;

    if (getRole(tx, buyerId) !== "buyer") {
      return res.status(403).json({ error: "Only the buyer can deposit funds." });
    }
    if (tx.milestone1.buyerFundsDeposited) {
      return res.status(400).json({ error: "Funds already deposited for this milestone." });
    }
    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required." });
    }

    // Verify with Stripe that the PaymentIntent was authorized (card held, not yet charged)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "requires_capture") {
      return res.status(400).json({
        error: `Payment is not in an authorized state. Current status: ${paymentIntent.status}`,
      });
    }

    // Confirm the PaymentIntent belongs to this transaction
    if (paymentIntent.metadata.transactionId !== tx._id.toString()) {
      return res.status(400).json({ error: "PaymentIntent does not match this transaction." });
    }

    tx.stripePaymentIntentId          = paymentIntentId;
    tx.milestone1.buyerFundsDeposited = true;
    tx.milestone1.buyerDepositedAt    = new Date();
    tx.milestone1.depositTxRef        = paymentIntentId;
    tx.escrowAmount                   = tx.amount;

    const sellerDone = !!tx.milestone1.sellerSubmittedAt;
    tx.milestone1.status = sellerDone ? "completed" : "buyer_funded";

    if (sellerDone) {
      tx.status            = "milestone2";
      tx.milestone2.status = "awaiting_confirmation";
    }

    await tx.save();
    return res.json({ transaction: tx });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /transactions/:id/milestone2/confirm ──────────────────────────────
/**
 * Buyer confirms they received what was agreed upon → triggers fund release.
 * Body: { buyerId, buyerConfirmNote? }
 */
router.patch("/:id/milestone2/confirm", async (req: Request, res: Response) => {
  try {
    const tx = await TransactionModel.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    if (tx.status !== "milestone2") {
      return res.status(400).json({ error: "Transaction is not in milestone 2." });
    }
    if (tx.milestone2.status !== "awaiting_confirmation") {
      return res.status(400).json({ error: "Milestone 2 is not awaiting confirmation." });
    }

    const { buyerId, buyerConfirmNote } = req.body;

    if (getRole(tx, buyerId) !== "buyer") {
      return res.status(403).json({ error: "Only the buyer can confirm delivery." });
    }

    tx.milestone2.buyerConfirmed   = true;
    tx.milestone2.buyerConfirmedAt = new Date();
    tx.milestone2.buyerConfirmNote = buyerConfirmNote ?? null;
    tx.milestone2.status           = "confirmed";

    // ── Fund release via Stripe ───────────────────────────────────────────
    // Capture the previously authorized PaymentIntent — this is when the
    // buyer's card is actually charged.
    if (!tx.stripePaymentIntentId) {
      return res.status(400).json({ error: "No Stripe PaymentIntent found on this transaction." });
    }

    const capture = await stripe.paymentIntents.capture(tx.stripePaymentIntentId);

    tx.milestone2.fundsReleasedAt = new Date();
    tx.milestone2.releaseTxRef    = capture.id;
    tx.milestone2.status          = "funds_released";
    tx.escrowAmount               = 0;
    tx.status                     = "completed";

    // Credit the seller's in-app balance (simulates payout until Stripe Connect is set up)
    await User.findByIdAndUpdate(tx.sellerId, { $inc: { funds: tx.amount } });

    await tx.save();
    return res.json({ transaction: tx, message: "Funds captured and released to seller." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /transactions/:id/cancel ─────────────────────────────────────────
/**
 * Cancel a transaction that hasn't moved past milestone 1 yet.
 * Body: { userId }
 */
router.patch("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const tx = await TransactionModel.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found." });

    const { userId } = req.body;
    const role = getRole(tx, userId);
    if (!role) return res.status(403).json({ error: "Not a party to this transaction." });

    if (!["initiated", "milestone1"].includes(tx.status)) {
      return res.status(400).json({
        error: "Cannot cancel a transaction that has progressed to milestone 2.",
      });
    }

    tx.status      = "cancelled";
    tx.cancelledAt = new Date();
    tx.cancelledBy = role;

    // If buyer had already deposited, cancel the Stripe PaymentIntent to release the hold
    if (tx.milestone1.buyerFundsDeposited && tx.stripePaymentIntentId) {
      await stripe.paymentIntents.cancel(tx.stripePaymentIntentId);
      tx.escrowAmount = 0;
    }

    await tx.save();
    return res.json({ transaction: tx, message: "Transaction cancelled." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;