import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "";

export const initSocket = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    socket = io(SOCKET_URL, {
      withCredentials: true,
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
    });
  });
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
