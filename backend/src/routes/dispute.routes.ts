import express from "express";
import {
  createDispute,
  escalateDispute,
  getDisputes,
  getDisputeByTransaction,
  updateDisputeStatus,
} from "../controllers/dispute.controller";
import protectRoute from "../utils/protectRoute";

const disputeRouter = express.Router();

// New dedicated escalation endpoint (from EscalationPage)
disputeRouter.post("/escalate/:transactionId", protectRoute, escalateDispute);

// Check if a dispute exists for a given transaction (used by ViewListing + EscalationPage)
disputeRouter.get("/transaction/:transactionId", protectRoute, getDisputeByTransaction);

// Mediator: get all disputes
disputeRouter.get("/", protectRoute, getDisputes);

// Mediator: rule on a dispute
disputeRouter.post("/update/:id", protectRoute, updateDisputeStatus);

// Legacy (returns 410 — safe to remove after confirming no callers)
disputeRouter.post("/create", protectRoute, createDispute);

export default disputeRouter;