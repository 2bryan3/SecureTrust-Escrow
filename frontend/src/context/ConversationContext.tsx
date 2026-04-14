import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getSocket, initSocket } from "../utils/socket";
import { useAuth } from "./AuthContext";
import { api } from "../api/api";

export type ConversationParticipant = {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
};

export type ConversationMessage = {
  _id: string;
  text: string;
  sender: string;
  createdAt: string;
  conversationId?: string;
};

export type Conversation = {
  _id: string;
  participants: ConversationParticipant[];
  lastMessage?: ConversationMessage;
  updatedAt: string;
};

type ConversationContextType = {
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  unreadCount: number;
  messagesMap: Record<string, ConversationMessage[]>;
  setMessagesMap: Dispatch<SetStateAction<Record<string, ConversationMessage[]>>>;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesMap, setMessagesMap] = useState<Record<string, ConversationMessage[]>>({});

  // Fetch conversations and ensure socket is running whenever user is available
  // This covers both the explicit login flow and page refreshes.
  useEffect(() => {
    if (authLoading || !user) {
      if (!user) setConversations([]);
      return;
    }
    if (!getSocket()) initSocket().catch(() => {
      // redirect handled inside initSocket for AUTH_FAILED; suppress unhandled rejection
    });
    api<Conversation[]>("/api/conversations").then(setConversations).catch(console.error);
  }, [user, authLoading]);

  // Keep refs so the socket handler always reads latest values without re-attaching
  const panelOpenRef = useRef(panelOpen);
  const activeConvIdRef = useRef(activeConversationId);
  useEffect(() => { panelOpenRef.current = panelOpen; }, [panelOpen]);
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

  // Reset unread count when panel opens
  useEffect(() => {
    if (panelOpen) setUnreadCount(0);
  }, [panelOpen]);

  // Attach socket "newMessage" listener once socket connects
  useEffect(() => {
    const handler = (data: { conversationId: string; message: ConversationMessage }) => {
      const { conversationId, message } = data;

      // Add message (deduplicate by _id)
      setMessagesMap(prev => {
        const existing = prev[conversationId] ?? [];
        if (existing.some(m => m._id === String(message._id))) return prev;
        return { ...prev, [conversationId]: [...existing, message] };
      });

      // Bubble up the lastMessage in the conversation list, or fetch if conversation is new
      setConversations(prev => {
        const exists = prev.some(c => c._id === conversationId);
        if (!exists) {
          // This is a new conversation (e.g. someone messaged us for the first time).
          // Re-fetch the full list so it appears without requiring a page refresh.
          api<Conversation[]>("/api/conversations")
            .then(convs => setConversations(convs))
            .catch(console.error);
          return prev;
        }
        return prev
          .map(c => c._id === conversationId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });

      // Only increment unread when panel is closed or a different conversation is active
      if (!panelOpenRef.current || activeConvIdRef.current !== conversationId) {
        setUnreadCount(n => n + 1);
      }
    };

    const attach = () => {
      const socket = getSocket();
      if (!socket) return;
      socket.off("newMessage", handler);
      socket.on("newMessage", handler);
    };

    // Try immediately (handles page refresh while socket is already up)
    attach();

    // Also re-attach whenever the socket (re)connects
    window.addEventListener("socketConnected", attach);
    return () => {
      window.removeEventListener("socketConnected", attach);
      getSocket()?.off("newMessage", handler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      conversations,
      setConversations,
      panelOpen,
      setPanelOpen,
      activeConversationId,
      setActiveConversationId,
      unreadCount,
      messagesMap,
      setMessagesMap,
    }),
    [conversations, panelOpen, activeConversationId, unreadCount, messagesMap]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (!context) throw new Error("useConversationContext must be used inside ConversationProvider");
  return context;
}
