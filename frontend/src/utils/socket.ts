import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

// In dev, connect to the same origin so the Vite proxy forwards /socket.io to the backend.
const SOCKET_URL = import.meta.env.VITE_API_URL ?? "";

export const initSocket = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      // query: { userId } removed — backend derives userId from verified JWT cookie
    });

    socket.once("connect", () => {
      window.dispatchEvent(new Event("socketConnected"));
      resolve();
    });

    socket.once("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
      if (err.message === "AUTH_FAILED") {
        socket?.disconnect();
        socket = null;
        window.location.href = "/login";
        reject(err);
      }
      // Non-AUTH_FAILED errors (network outage, server restart) — let socket.io reconnect automatically
    });
  });
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
