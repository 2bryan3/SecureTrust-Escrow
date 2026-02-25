import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./db/db";
import usersRouter from "./routes/Users";
import authRouter from "./routes/auth";



dotenv.config();

const app = express();
app.use(express.json());

// If using cookie-based auth later, keep this shape:
app.use(
  cors({
    origin: "http://localhost:5173", // your Vite dev URL
    credentials: true,
  })
);

app.use("/Users", usersRouter);
app.use("/auth", authRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));


async function start() {
  await connectDB();

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on ${port}`));
}

start().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});