import { useCallback, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { api } from "../../lib/urls";
import { PaginatedData } from "../../lib/paginatedData";
import type { Conversation, Message } from "../../lib/models";

export function ChatTenant() {
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

  const headerTitle = selectedConversation?.participants?.find((p) => p.role !== "tenant")?.name ?? "Property Management";
  const headerSubtitle = selectedConversation?.apartment?.building?.name ?? "";

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Messages</h1>
        <p className="text-muted-foreground">Chat with your property manager</p>
      </div>

      <Card className="h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border">
          <h3 className="text-lg">{headerTitle}</h3>
          <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesQuery.loading ? (
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<Send size={24} className="text-muted-foreground" />}
              title="No messages yet"
              description="Start the conversation with your manager."
            />
          ) : (
            messages.map((msg) => {
              const role = msg.sender_role ?? msg.sender?.role ?? msg.sender_type ?? "";
              const isTenant = role.toLowerCase() === "tenant";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isTenant ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isTenant ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-xs mt-1 ${isTenant ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
  );
}
