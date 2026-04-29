import express from "express";
import { 
    getConversations, 
    getOrCreateConversation, 
    getMessages, 
    sendMessage, 
    hideConversation,
    markConversationRead
} from "../controllers/conversation.controller";
import { authenticate } from "../controllers/auth.controller";

const convRouter = express.Router();

convRouter.get("/", authenticate, getConversations);
convRouter.post("/", authenticate, getOrCreateConversation);
convRouter.get("/:id/messages", authenticate, getMessages);
convRouter.post("/:id/messages", authenticate, sendMessage);
convRouter.patch("/:id/read", authenticate, markConversationRead);
convRouter.delete("/:id", authenticate, hideConversation);

export default convRouter;
