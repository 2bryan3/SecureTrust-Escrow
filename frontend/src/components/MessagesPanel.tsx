import React, { useState, useEffect, useRef } from "react";
import { X, Send, Trash2 } from "lucide-react";
import {
  useConversationContext,
  type Conversation,
  type ConversationMessage,
} from "../context/ConversationContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import "../styles/MessagesPanel.css";

export const MessagesPanel: React.FC = () => {
  const {
    conversations,
    setConversations,
    panelOpen,
    setPanelOpen,
    activeConversationId,
    setActiveConversationId,
    messagesMap,
    setMessagesMap,
  } = useConversationContext();
  const { user } = useAuth();

  const [inputText, setInputText] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c._id === activeConversationId) ?? null;
  const messages: ConversationMessage[] = activeConversationId
    ? (messagesMap[activeConversationId] ?? [])
    : [];

  // Re-fetch messages every time the active conversation changes or the panel (re)opens
  useEffect(() => {
    if (!activeConversationId || !panelOpen) return;
    let cancelled = false;
    setLoadingMsgs(true);
    api<ConversationMessage[]>(`/api/conversations/${activeConversationId}/messages`)
      .then(msgs => {
        if (cancelled) return;
        setMessagesMap(prev => {
          const existing = prev[activeConversationId] ?? [];
          const dbIds = new Set(msgs.map(m => m._id));
          const socketOnly = existing.filter(m => !dbIds.has(m._id));
          const merged = [...msgs, ...socketOnly].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return { ...prev, [activeConversationId]: merged };
        });
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingMsgs(false); });
    return () => { cancelled = true; };
  }, [activeConversationId, panelOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !activeConversationId) return;
    setInputText("");

    try {
      const message = await api<ConversationMessage>(
        `/api/conversations/${activeConversationId}/messages`,
        { method: "POST", body: { text } }
      );
      setMessagesMap(prev => {
        const existing = prev[activeConversationId] ?? [];
        if (existing.some(m => m._id === String(message._id))) return prev;
        return { ...prev, [activeConversationId]: [...existing, message] };
      });
      // Update lastMessage in conversation list
      setConversations(prev =>
        prev
          .map(c => c._id === activeConversationId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await api(`/api/conversations/${convId}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConversationId === convId) setActiveConversationId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find(p => String(p._id) !== String(user?._id)) ?? conv.participants[0];

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!panelOpen) return null;

  return (
    <>
      <div className="mp-overlay" onClick={() => setPanelOpen(false)} />
      <div className="mp-panel">
        {/* Header */}
        <div className="mp-header">
          <h3 className="mp-title">Messages</h3>
          <button className="mp-close" onClick={() => setPanelOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mp-body">
          {/* Conversation list */}
          <div className="mp-conv-list">
            {conversations.length === 0 ? (
              <p className="mp-empty">No conversations yet</p>
            ) : (
              conversations.map(conv => {
                const other = getOtherParticipant(conv);
                const isActive = conv._id === activeConversationId;
                return (
                  <div
                    key={conv._id}
                    className={`mp-conv-item${isActive ? " mp-conv-item--active" : ""}`}
                    onClick={() => setActiveConversationId(conv._id)}
                  >
                    <div className="mp-conv-avatar">
                      {other?.firstName?.[0] ?? "?"}
                      {other?.lastName?.[0] ?? ""}
                    </div>
                    <div className="mp-conv-info">
                      <span className="mp-conv-name">
                        {other?.firstName} {other?.lastName}
                      </span>
                      {conv.lastMessage && (
                        <span className="mp-conv-preview">{conv.lastMessage.text}</span>
                      )}
                    </div>
                    <button
                      className="mp-conv-delete"
                      onClick={e => handleDeleteConversation(e, conv._id)}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Message thread */}
          <div className="mp-thread">
            {!activeConversationId ? (
              <div className="mp-thread-empty">
                <p>Select a conversation</p>
              </div>
            ) : (
              <>
                <div className="mp-thread-header">
                  {activeConversation && (
                    <span>
                      {getOtherParticipant(activeConversation)?.firstName}{" "}
                      {getOtherParticipant(activeConversation)?.lastName}
                    </span>
                  )}
                </div>

                <div className="mp-messages">
                  {loadingMsgs ? (
                    <div className="mp-loading">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="mp-loading">No messages yet. Say hello!</div>
                  ) : (
                    messages.map(msg => {
                      const myId = user?._id ? String(user._id) : "";
                      const senderId = msg.sender ? String(msg.sender) : "";
                      const isMine = !!myId && myId === senderId;
                      return (
                        <div
                          key={msg._id}
                          className={`mp-msg${isMine ? " mp-msg--mine" : " mp-msg--theirs"}`}
                        >
                          <div className="mp-msg-bubble">{msg.text}</div>
                          <span className="mp-msg-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mp-input-row">
                  <input
                    className="mp-input"
                    placeholder="Type a message…"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                  />
                  <button
                    className="mp-send-btn"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    aria-label="Send"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
