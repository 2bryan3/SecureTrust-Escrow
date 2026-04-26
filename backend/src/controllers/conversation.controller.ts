import { Request, Response } from "express";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { getIO, getSocketId } from "../utils/socketManager";

export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const conversations = await Conversation.find({
            participants: userId,
            hiddenBy: { $ne: userId },
        })
        .populate("participants", "firstName lastName avatar")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

        res.status(200).json(conversations);
    } catch (error: any) {
        console.log("Error in getConversations:", error.message);
        res.status(500).json({ error: "Internal Server Error" }); // Send Error Message to User
    }
};

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { participantId } = req.body;
        const userId = req.user?._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [userId, participantId], $size: 2 },
        });

        if (conversation) {
        // Unhide for both participants when conversation is re-initiated
        await Conversation.findByIdAndUpdate(conversation._id, {
            $pull: { hiddenBy: { $in: [userId, participantId] } },
        });
        } else {
            conversation = await Conversation.create({
                participants: [userId, participantId],
            });
        }

        const populated = await Conversation.findById(conversation._id)
            .populate("participants", "firstName lastName avatar")
            .populate("lastMessage");

        res.status(200).json(populated);
    } catch (error: any) {
        console.log("Error in getOrCreateConversation:", error.message);
        res.status(500).json({ error: "Internal Server Error" }); // Send Error Message to User
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const conversation = await Conversation.findOne({ _id: id, participants: userId });
        if (!conversation) {
            return res.status(403).json({ error: "Forbidden" }); // Send Error Message to User
        }

        const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error: any) {
        console.log("Error in getMessages:", error.message);
        res.status(500).json({ error: "Internal Server Error" }); // Send Error Message to User
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const senderId = req.user?._id;

        // Verify sender is authed before creating anything
        const conversation = await Conversation.findOne({ _id: id, participants: senderId });
        if (!conversation) {
            return res.status(403).json({ error: "Forbidden" }); // Send Error Message to User
        }

        const message = await Message.create({
            conversationId: id,
            sender: senderId,
            text,
        });

        await Conversation.findByIdAndUpdate(id, { lastMessage: message._id });

        // Use socket to send to everyone in real time
        const io = getIO();
        if (io) {
            const payload = {
                conversationId: id,
                message: {
                    _id: message._id.toString(),
                    text: message.text,
                    sender: String(senderId),
                    createdAt: message.createdAt,
                    conversationId: id,
                },
            };
            conversation.participants.forEach((participantId: any) => {
                const socketId = getSocketId(participantId.toString());
                if (socketId) {
                    io.to(socketId).emit("newMessage", payload);
                }
            });
        }

        res.status(201).json(message);
    } catch (error: any) {
        console.log("Error in sendMessage:", error.message);
        res.status(500).json({ error: "Internal Server Error" }); // Send Error Message to User
    }
};

export const hideConversation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        // Allow participants to hide their own view of a conversation
        const conversation = await Conversation.findOne({ _id: id, participants: userId });
        if (!conversation) {
            return res.status(403).json({ error: "Forbidden" }); // Send Error Message to User
        }

        await Conversation.findByIdAndUpdate(id, { $addToSet: { hiddenBy: userId } });
        res.status(200).json({ success: true });
    } catch (error: any) {
        console.log("Error in hideConversation:", error.message);
        res.status(500).json({ error: "Internal Server Error" }); // Send Error Message to User
    }
};
