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

disputeRouter.post("/escalate/:transactionId", protectRoute, escalateDispute);

disputeRouter.get("/transaction/:transactionId", protectRoute, getDisputeByTransaction);

disputeRouter.get("/", protectRoute, getDisputes);

disputeRouter.post("/update/:id", protectRoute, updateDisputeStatus);

disputeRouter.post("/create", protectRoute, createDispute);

export default disputeRouter;