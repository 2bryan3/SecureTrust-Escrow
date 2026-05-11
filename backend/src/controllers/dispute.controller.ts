import { Request, Response } from "express";
import { Dispute } from "../models/dispute.model";
import { TransactionModel } from "../models/transaction.model";
import { Listing } from "../models/listing.model";
import { User } from "../models/user.model";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { stripe } from "../utils/stripe";
import { getIO, getSocketId } from "../utils/socketManager";
import { sendBotMessage } from "../utils/botMessage";

// ─── POST /api/disputes/escalate/:transactionId ──────────────────────────────
export const escalateDispute = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { escalationMessage, evidence, reason } = req.body;
    const reportedBy = req.user?._id;

    if (!escalationMessage?.trim()) {
      return res.status(400).json({ message: "An escalation message is required." });
    }

    const tx = await TransactionModel.findById(transactionId)
      .populate("listingId")
      .populate("buyerId",  "firstName lastName email")
      .populate("sellerId", "firstName lastName email");

    if (!tx) return res.status(404).json({ message: "Transaction not found." });

    const isBuyer  = (tx.buyerId  as any)._id?.toString() === reportedBy?.toString();
    const isSeller = (tx.sellerId as any)._id?.toString() === reportedBy?.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "You are not a party to this transaction." });
    }

    if (["completed", "cancelled"].includes(tx.status)) {
      return res.status(400).json({ message: "Cannot escalate a completed or cancelled transaction." });
    }

    const existing = await Dispute.findOne({
      transactionId,
      status: { $in: ["Pending", "Under Review"] },
    });
    if (existing) {
      return res.status(400).json({ message: "A dispute for this transaction is already open." });
    }

    const listing = tx.listingId as any;

    const dispute = await Dispute.create({
      transactionId,
      listingID:         listing._id,
      buyerID:           tx.buyerId,
      sellerID:          tx.sellerId,
      reportedBy,
      escalationMessage: escalationMessage.trim(),
      evidence:          Array.isArray(evidence) ? evidence : [],
      reason:            reason?.trim() || escalationMessage.trim(),
    });

    await Listing.findByIdAndUpdate(listing._id, { isEscalated: true });
    await TransactionModel.findByIdAndUpdate(transactionId, { status: "disputed" });

    // ── Bot notifications to both parties ─────────────────────────────────────
    const listingTitle = listing.title ?? "your listing";
    const buyerId  = (tx.buyerId  as any)._id?.toString() ?? tx.buyerId.toString();
    const sellerId = (tx.sellerId as any)._id?.toString() ?? tx.sellerId.toString();

    await sendBotMessage(
      buyerId,
      `⚖️ Your dispute for "${listingTitle}" has been submitted. A mediator will review your case and notify you here of their ruling.`
    );
    await sendBotMessage(
      sellerId,
      `⚖️ A dispute has been filed for your listing "${listingTitle}". A mediator will review the case and notify you here of their ruling.`
    );

    return res.status(200).json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/disputes ────────────────────────────────────────────────────────
export const getDisputes = async (_req: Request, res: Response) => {
  try {
    const disputes = await Dispute.find()
      .populate("listingID",  "title price")
      .populate("buyerID",    "firstName lastName email")
      .populate("sellerID",   "firstName lastName email")
      .populate("reportedBy", "firstName lastName")
      .populate({
        path: "transactionId",
        select: "amount escrowAmount status milestone1 milestone2 stripePaymentIntentId currency listingId",
        populate: { path: "listingId", select: "deliveryMethod" },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ disputes });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/disputes/transaction/:transactionId ────────────────────────────
export const getDisputeByTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const dispute = await Dispute.findOne({ transactionId })
      .sort({ createdAt: -1 })
      .populate("reportedBy", "firstName lastName");

    return res.status(200).json({ dispute: dispute ?? null });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/disputes/update/:id ───────────────────────────────────────────
export const updateDisputeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, decisionNotes } = req.body;

    if (!["Resolved", "Refunded", "Dismissed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }
    if (!decisionNotes?.trim() || decisionNotes.trim().length < 10) {
      return res.status(400).json({ message: "Decision notes are required (10+ chars)." });
    }

    const dispute = await Dispute.findById(id).populate("listingID", "title _id");
    if (!dispute) return res.status(404).json({ message: "Dispute not found." });

    const tx = await TransactionModel.findById(dispute.transactionId);
    const listingTitle = (dispute.listingID as any)?.title ?? "your listing";

    // ── Stripe actions ────────────────────────────────────────────────────────
    if (tx && tx.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(tx.stripePaymentIntentId);

      if (status === "Refunded") {
        if (tx) {
          tx.status = "milestone3";
          tx.milestone3.status = "awaiting_return";
          await tx.save();
        }
        await Listing.findByIdAndUpdate(dispute.listingID, { isEscalated: false, isLocked: true });
        await Dispute.findByIdAndUpdate(id, { status: "Refunded", decisionNotes: decisionNotes.trim() });
      }

      if (status === "Resolved") {
        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.capture(tx.stripePaymentIntentId);
        }
        await User.findByIdAndUpdate(tx.sellerId, {
          $inc: { funds: tx.amount, totalSales: 1 },
        });
        tx.status       = "completed";
        tx.escrowAmount = 0;
        await tx.save();
      }
    }

    // ── Flip listing flags ────────────────────────────────────────────────────
    if (tx) {
      const listingUpdate: Record<string, boolean> = { isEscalated: false };
      if (status === "Resolved") {
        listingUpdate.isSold   = true;
        listingUpdate.isLocked = false;
      }
      if (status === "Refunded") {
        listingUpdate.isSold   = true;
        listingUpdate.isLocked = false;
      }
      if (status === "Dismissed") {
        listingUpdate.isLocked = false;
        listingUpdate.isSold   = false;
      }
      await Listing.findByIdAndUpdate((dispute.listingID as any)._id, listingUpdate);
    }

    // ── Save ruling ───────────────────────────────────────────────────────────
    await Dispute.findByIdAndUpdate(id, { status, decisionNotes: decisionNotes.trim() });

    // ── Bot notifications to both parties ─────────────────────────────────────
    const buyerId  = dispute.buyerID.toString();
    const sellerId = dispute.sellerID.toString();
    const notes    = decisionNotes.trim();

    if (status === "Resolved") {
      await sendBotMessage(
        buyerId,
        `⚖️ The mediator has ruled on the dispute for "${listingTitle}". The ruling was in favor of the seller — funds have been released. Decision: "${notes}"`
      );
      await sendBotMessage(
        sellerId,
        `⚖️ The mediator has ruled on the dispute for "${listingTitle}". The ruling was in your favor — funds have been released to your balance. Decision: "${notes}"`
      );
    } else if (status === "Refunded") {
      await sendBotMessage(buyerId,
          `⚖️ The mediator has ruled in your favor for "${listingTitle}". Please ship the item back to the seller. Once the seller confirms receipt, your refund will be issued. Decision: "${notes}"`
        );
        await sendBotMessage(sellerId,
          `⚖️ The mediator has ruled in favor of the buyer for "${listingTitle}". The buyer will ship the item back to you. Once you confirm receipt, the buyer's refund will be issued. Decision: "${notes}"`
        );
        return res.status(200).json({ success: true });
    } else if (status === "Dismissed") {
      const dismissedMsg = `⚖️ The dispute for "${listingTitle}" has been dismissed by the mediator. Decision: "${notes}"`;
      await sendBotMessage(buyerId,  dismissedMsg);
      await sendBotMessage(sellerId, dismissedMsg);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Legacy createDispute ─────────────────────────────────────────────────────
export const createDispute = async (req: Request, res: Response) => {
  return res.status(410).json({
    message: "This endpoint is deprecated. Use POST /api/disputes/escalate/:transactionId instead.",
  });
};