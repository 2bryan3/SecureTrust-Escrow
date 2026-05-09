import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { getIO, getSocketId } from "./socketManager";

export const sendBotMessage = async (recipientId: string, text: string) => {
  const systemUserId = process.env.SYSTEM_USER_ID;
  if (!systemUserId) throw new Error("SYSTEM_USER_ID not set in environment variables.");

  let conversation = await Conversation.findOne({
    participants: { $all: [systemUserId, recipientId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [systemUserId, recipientId],
    });
  } else {
    await Conversation.findByIdAndUpdate(conversation._id, {
      $pull: { hiddenBy: recipientId },
    });
  }

  conversation = await Conversation.findById(conversation._id).populate(
    "participants",
    "firstName lastName avatar"
  );
  if (!conversation) throw new Error("Conversation not found after creation.");

  const message = await Message.create({
    conversationId: conversation._id,
    sender: systemUserId,
    text,
  });

  await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: message._id });

  const io = getIO();
  if (io) {
    const payload = {
      conversationId: conversation._id.toString(),
      message: {
        _id: message._id.toString(),
        text: message.text,
        sender: systemUserId,
        createdAt: message.createdAt,
        conversationId: conversation._id.toString(),
      },
    };
    [systemUserId, recipientId].forEach((uid) => {
      const socketId = getSocketId(uid.toString());
      if (socketId) io.to(socketId).emit("newMessage", payload);
    });
  }
};