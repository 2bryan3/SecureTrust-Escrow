import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import app from "./app";
import { setIO, setOnlineUser, removeOnlineUser } from "./utils/socketManager";
import { User } from "./models/user.model";

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

setIO(io);

io.use(async (socket, next) => {
  console.log("Socket authenticating");
  const raw = socket.handshake.headers.cookie ?? "";
  const cookies = parse(raw);
  const token = cookies["jwt"];

  if (!token) {
    console.log("Socket: no token");
    return next(new Error("AUTH_FAILED"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("Socket: user not found");
      return next(new Error("AUTH_FAILED"));
    }
    if (user.isBanned) {
      console.log("Socket: user banned");
      return next(new Error("AUTH_FAILED"));
    }

    socket.data.userId = String(user._id);
    console.log("Socket auth successful");
    next();
  } catch {
    console.log("Socket: invalid or expired token");
    next(new Error("AUTH_FAILED"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  if (userId) {
    setOnlineUser(userId, socket.id);
  }

  socket.on("disconnect", () => {
    if (userId) removeOnlineUser(userId);
  });
});

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    httpServer.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
