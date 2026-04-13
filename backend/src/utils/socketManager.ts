import { Server } from "socket.io";

let ioInstance: Server | null = null;
const onlineUsers = new Map<string, string>();

export const setIO = (io: Server): void => {
    ioInstance = io;
};

export const getIO = (): Server | null => ioInstance;

export const setOnlineUser = (userId: string, socketId: string): void => {
    onlineUsers.set(userId, socketId);
};

export const removeOnlineUser = (userId: string): void => {
    onlineUsers.delete(userId);
};

export const getSocketId = (userId: string): string | undefined => {
    return onlineUsers.get(userId);
};
