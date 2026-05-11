import { Router, Request, Response } from "express";
import { Rating } from "../models/rating.model";
import { TransactionModel } from "../models/transaction.model";
import { User } from "../models/user.model";
import protectRoute from "../utils/protectRoute";

const router = Router();

// POST /api/ratings
router.post("/", protectRoute, async (req: Request, res: Response) => {
  try {
    const { transactionId, rating, note } = req.body;
    const reviewerId = req.user?._id;

    if (!transactionId || !rating) {
      return res.status(400).json({ error: "transactionId and rating are required." });
    }

    const tx = await TransactionModel.findById(transactionId);
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    if (tx.status !== "completed") {
      return res.status(400).json({ error: "Can only rate completed transactions." });
    }

    const isBuyer  = tx.buyerId.toString()  === reviewerId?.toString();
    const isSeller = tx.sellerId.toString() === reviewerId?.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: "Not a party to this transaction." });
    }

    const revieweeId = isBuyer ? tx.sellerId : tx.buyerId;
    const role       = isBuyer ? "seller" : "buyer";

    const existing = await Rating.findOne({ transactionId, reviewerId });
    if (existing) {
      return res.status(400).json({ error: "You have already rated this transaction." });
    }

    await Rating.create({ transactionId, reviewerId, revieweeId, role, rating, note: note ?? null });

    const allRatings = await Rating.find({ revieweeId });
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(avg * 10) / 10,
      totalRatings: allRatings.length,
    });

    return res.status(201).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/ratings/user/:userId
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ revieweeId: userId })
      .populate("reviewerId", "firstName lastName avatar")
      .sort({ createdAt: -1 });
    return res.json({ ratings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/ratings/transaction/:transactionId/mine
// Check if the current user has already rated this transaction
router.get("/transaction/:transactionId/mine", protectRoute, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const reviewerId = req.user?._id;
    const existing = await Rating.findOne({ transactionId, reviewerId });
    return res.json({ hasRated: !!existing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;