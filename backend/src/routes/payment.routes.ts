import { Router, Request, Response } from "express";
import express from "express";
import { stripe } from "../utils/stripe";
import { TransactionModel } from "../models/transaction.model";
import { Listing } from "../models/listing.model";

const router = Router();

// ─── POST /payment/create-payment-intent ────────────────────────────────────
/**
 * Creates a Stripe PaymentIntent for a transaction's escrow deposit.
 * Uses manual capture so funds are only authorized (not charged) until
 * the buyer confirms delivery at milestone 2.
 *
 * Body: { transactionId }
 * Returns: { clientSecret, paymentIntentId }
 */
router.post("/create-payment-intent", async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required." });
    }

    const tx = await TransactionModel.findById(transactionId);
    if (!tx) return res.status(404).json({ error: "Transaction not found." });

    if (tx.status !== "milestone1") {
      return res.status(400).json({ error: "Transaction is not accepting deposits right now." });
    }

    if (tx.milestone1.buyerFundsDeposited) {
      return res.status(400).json({ error: "Funds already deposited for this transaction." });
    }

    const amountInCents = Math.round(tx.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: (tx.currency ?? "usd").toLowerCase(),
      capture_method: "manual",
      metadata: {
        transactionId: tx._id.toString(),
        buyerId: tx.buyerId.toString(),
        sellerId: tx.sellerId.toString(),
      },
    });

    tx.stripePaymentIntentId = paymentIntent.id;
    await tx.save();

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /payment/webhook ───────────────────────────────────────────────────
/**
 * Stripe webhook handler.
 * Requires raw body — uses express.raw() middleware on this route only.
 *
 * Handles:
 *   payment_intent.amount_capturable_updated → buyer's card authorized, mark funds deposited
 *   payment_intent.payment_failed            → notify / log failure
 *   payment_intent.canceled                  → sync cancellation state
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // In development without a webhook secret, parse body directly
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    const paymentIntent = event.data?.object as any;

    try {
      switch (event.type) {
        case "payment_intent.amount_capturable_updated": {
          const tx = await TransactionModel.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });

          if (tx && !tx.milestone1.buyerFundsDeposited) {
            tx.milestone1.buyerFundsDeposited = true;
            tx.milestone1.buyerDepositedAt    = new Date();
            tx.milestone1.depositTxRef        = paymentIntent.id;
            tx.escrowAmount                   = tx.amount;

            const sellerDone = !!tx.milestone1.sellerSubmittedAt;
            tx.milestone1.status = sellerDone ? "completed" : "buyer_funded";

            if (sellerDone) {
              tx.status             = "milestone2";
              tx.milestone2.status  = "awaiting_confirmation";
            }

            await tx.save();
            await Listing.findByIdAndUpdate(tx.listingId, { isLocked: true });
            console.log(`Transaction ${tx._id} — buyer funds authorized via webhook.`);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          console.warn(`PaymentIntent ${paymentIntent.id} failed:`, paymentIntent.last_payment_error?.message);
          const tx = await TransactionModel.findOne({ stripePaymentIntentId: paymentIntent.id });
          if (tx) await Listing.findByIdAndUpdate(tx.listingId, { isLocked: false });
          break;
        }

        case "payment_intent.canceled": {
          console.log(`PaymentIntent ${paymentIntent.id} was canceled.`);
          const tx = await TransactionModel.findOne({ stripePaymentIntentId: paymentIntent.id });
          if (tx) await Listing.findByIdAndUpdate(tx.listingId, { isLocked: false });
          break;
        }

        default:
          // Ignore unhandled event types
          break;
      }
    } catch (err: any) {
      console.error("Error processing webhook event:", err.message);
      return res.status(500).json({ error: "Webhook handler failed." });
    }

    return res.json({ received: true });
  }
);

export default router;
