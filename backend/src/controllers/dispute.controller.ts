import { Request, Response } from "express";
import { Dispute } from "../models/dispute.model";

export const createDispute = async (req: Request, res: Response) => {
  try {
    const { listingID, sellerID, reason } = req.body;
    const reportedBy = req.user?._id;
    const buyerID = req.user?._id;

    if (!listingID || !sellerID || !reason) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existing = await Dispute.findOne({ listingID, buyerID, status: "Pending" });
    if (existing) {
      return res.status(400).json({ message: "A dispute for this listing is already pending." });
    }

    const dispute = new Dispute({ listingID, buyerID, sellerID, reportedBy, reason });
    await dispute.save();

    return res.status(200).json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getDisputes = async (_req: Request, res: Response) => {
  try {
    const disputes = await Dispute.find()
      .populate("listingID", "title price")
      .populate("buyerID", "firstName lastName email")
      .populate("sellerID", "firstName lastName email")
      .populate("reportedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ disputes });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateDisputeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await Dispute.findByIdAndUpdate(id, { status });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};