import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { api } from "../../lib/urls";
import { PaginatedData } from "../../lib/paginatedData";
import type { Conversation, Message } from "../../lib/models";

export function ChatAdmin() {
  const selectConversations = useCallback(
    (data: unknown) => PaginatedData.from<Conversation>(data, "conversations"),
    []
  );
  const conversationsQuery = useApiQuery<unknown, PaginatedData<Conversation>>(api.conversations, {
    select: selectConversations,
  });
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const conversations = conversationsQuery.data?.items ?? [];

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id ?? null);
    }
  }, [selectedConversationId, conversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    apiPost(api.conversationRead(selectedConversationId)).catch(() => undefined);
  }, [selectedConversationId]);

  const selectMessages = useCallback(
    (data: unknown) => PaginatedData.from<Message>(data, "messages"),
    []
  );
  const messagesQuery = useApiQuery<unknown, PaginatedData<Message>>(
    selectedConversationId ? api.conversationMessages(selectedConversationId) : null,
    { enabled: Boolean(selectedConversationId), deps: [selectedConversationId], select: selectMessages }
  );
  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId) ?? null;

  const conversationTitle = (conv: Conversation) => {
    const participant = conv.participants?.find((p) => p.role !== "admin") ?? conv.participants?.[0];
    return participant?.name ?? `Conversation #${conv.id}`;
  };

  const conversationSubtitle = (conv: Conversation) => {
    const unit = conv.apartment?.unit_code;
    const building = conv.apartment?.building?.name;
    if (unit && building) return `${unit} · ${building}`;
    if (unit) return unit;
    if (building) return building;
    return "";
  };

  const messages = useMemo(() => messagesQuery.data?.items ?? [], [messagesQuery.data]);

  const handleSend = async () => {
    if (!selectedConversationId || messageText.trim().length === 0) return;
    setSending(true);
    try {
      await apiPost(api.conversationMessages(selectedConversationId), { body: messageText.trim() });
      setMessageText("");
      await messagesQuery.refetch();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Messages</h1>
        <p className="text-muted-foreground">Communicate with tenants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsQuery.loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Send size={24} className="text-muted-foreground" />}
                  title="No conversations"
                  description="Tenant messages will appear here when available."
                />
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`p-4 border-b border-border cursor-pointer transition-colors ${
                    selectedConversationId === conv.id ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span>{conversationTitle(conv)}</span>
                    {conv.unread_count ? (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{conversationSubtitle(conv)}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {conv.last_message?.body ?? "No messages yet"}
                    </p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {conv.last_message?.created_at ? formatDate(conv.last_message.created_at) : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            <h3 className="text-lg">{selectedConversation ? conversationTitle(selectedConversation) : "Messages"}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedConversation ? conversationSubtitle(selectedConversation) : "Select a conversation"}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesQuery.loading ? (
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((msg) => {
                const role = msg.sender_role ?? msg.sender?.role ?? msg.sender_type ?? "";
                const isAdmin = ["admin", "manager", "staff"].includes(role.toLowerCase());
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-xs mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {msg.created_at ? formatDate(msg.created_at) : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button disabled={!selectedConversationId || sending} onClick={handleSend}>
                <Send size={18} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
