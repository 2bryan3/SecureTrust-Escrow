import mongoose, { InferSchemaType } from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    },
  },
  { timestamps: true, versionKey: false }
);

export type ConversationType = InferSchemaType<typeof ConversationSchema>;
export const Conversation = mongoose.model("Conversation", ConversationSchema);
