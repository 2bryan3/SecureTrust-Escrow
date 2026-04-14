import mongoose, { InferSchemaType } from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export type MessageType = InferSchemaType<typeof MessageSchema>;
export const Message = mongoose.model("Message", MessageSchema);
