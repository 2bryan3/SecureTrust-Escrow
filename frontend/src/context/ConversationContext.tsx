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
  unreadCounts: Record<string, number>;
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
  markAsRead: (conversationId: string) => void;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
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

  // Derive total unread count from per-conversation unreadCounts
  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return conversations.reduce((total, conv) => {
      const count = conv.unreadCounts?.[user._id] ?? 0;
      return total + count;
    }, 0);
  }, [conversations, user]);

  // Mark a conversation as read — call backend and clear local count
  const markAsRead = (conversationId: string) => {
    if (!user) return;
    api(`/api/conversations/${conversationId}/read`, { method: "PATCH" }).catch(console.error);
    setConversations(prev =>
      prev.map(c => {
        if (c._id !== conversationId) return c;
        return {
          ...c,
          unreadCounts: { ...(c.unreadCounts ?? {}), [user._id]: 0 },
        };
      })
    );
  };


  // Keep refs so the socket handler always reads latest values without re-attaching
  const panelOpenRef = useRef(panelOpen);
  const activeConvIdRef = useRef(activeConversationId);
  useEffect(() => { panelOpenRef.current = panelOpen; }, [panelOpen]);
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

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
          .map(c => {
            if (c._id !== conversationId) return c;
 
            // Only increment unread if panel is closed or a different conv is active
            const isActiveAndOpen =
              panelOpenRef.current && activeConvIdRef.current === conversationId;
 
            const currentCount = c.unreadCounts?.[user?._id ?? ""] ?? 0;
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCounts: {
                ...(c.unreadCounts ?? {}),
                ...(user && !isActiveAndOpen
                  ? { [user._id]: currentCount + 1 }
                  : {}),
              },
            };
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
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
      markAsRead,
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
