import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import listingRouter from "./routes/listing.routes";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import disputeRouter from "./routes/dispute.routes";
import transactionRouter from "./routes/transaction.routes.";
import paymentRouter from "./routes/payment.routes";
import convRouter from "./routes/conversation.routes";
import raitingRouter from "./routes/rating.routes";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => res.json({ message: "Secure API running" }));
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/listings", listingRouter);
app.use("/disputes", disputeRouter);
app.use("/transactions", transactionRouter);
app.use("/payment", paymentRouter);
app.use("/conversations", convRouter);
app.use("/ratings", raitingRouter);

export default app;