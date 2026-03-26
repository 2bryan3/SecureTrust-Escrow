import express from "express";
import { createDispute, getDisputes, updateDisputeStatus } from "../controllers/dispute.controller";
import protectRoute from "../utils/protectRoute";

const disputeRouter = express.Router();

disputeRouter.post("/create", protectRoute, createDispute);
disputeRouter.get("/", protectRoute, getDisputes);
disputeRouter.post("/update/:id", protectRoute, updateDisputeStatus);

export default disputeRouter;