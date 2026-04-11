import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiPost } from '../../lib/api';
import { formatChatTimestamp, getInitials } from '../../lib/format';
import { api } from '../../lib/urls';
import { PaginatedData } from '../../lib/paginatedData';
import type { Conversation, Message } from '../../lib/models';

export function ChatAdmin() {
  const selectConversations = useCallback(
    (data: unknown) => PaginatedData.from<Conversation>(data, 'conversations'),
    [],
  );
  const conversationsQuery = useApiQuery<unknown, PaginatedData<Conversation>>(
    api.conversations,
    {
      select: selectConversations,
    },
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const conversations = conversationsQuery.data?.items ?? [];
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id ?? null);
    }
  }, [selectedConversationId, conversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    apiPost(api.conversationRead(selectedConversationId)).catch(
      () => undefined,
    );
  }, [selectedConversationId]);

  const selectMessages = useCallback(
    (data: unknown) => PaginatedData.from<Message>(data, 'messages'),
    [],
  );
  const messagesQuery = useApiQuery<unknown, PaginatedData<Message>>(
    selectedConversationId
      ? api.conversationMessages(selectedConversationId)
      : null,
    {
      enabled: Boolean(selectedConversationId),
      deps: [selectedConversationId],
      select: selectMessages,
    },
  );
  const selectedConversation =
    conversations.find((conv) => conv.id === selectedConversationId) ?? null;

  const messages = useMemo(
    () => messagesQuery.data?.items ?? [],
    [messagesQuery.data],
  );
  const filteredConversations = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [
        conversation.title,
        conversation.subtitle,
        conversation.last_message?.body,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedTerm)),
    );
  }, [conversations, searchTerm]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedConversationId || messageText.trim().length === 0) return;
    setSending(true);
    try {
      await apiPost(api.conversationMessages(selectedConversationId), {
        body: messageText.trim(),
      });
      setMessageText('');
      await Promise.all([
        conversationsQuery.refetch(),
        messagesQuery.refetch(),
      ]);
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
        <Card className="overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                aria-label="Search conversations"
                className="w-full pl-10 pr-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsQuery.loading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Send size={24} className="text-muted-foreground" />}
                  title={
                    conversations.length === 0
                      ? 'No conversations'
                      : 'No matching conversations'
                  }
                  description={
                    conversations.length === 0
                      ? 'Tenant messages will appear here when available.'
                      : 'Try a different search term.'
                  }
                />
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`border-b border-border cursor-pointer transition-colors px-4 py-3 ${
                    selectedConversationId === conv.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {getInitials(conv.title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {conv.title ?? `Conversation #${conv.id}`}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {conv.subtitle || 'Direct conversation'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            {conv.last_message?.created_at
                              ? formatChatTimestamp(
                                  conv.last_message.created_at,
                                )
                              : ''}
                          </span>
                          {conv.unread_count ? (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {conv.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {conv.last_message?.body
                          ? `${conv.last_message.is_mine ? 'You: ' : ''}${conv.last_message.body}`
                          : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden flex flex-col bg-muted/20">
          <div className="border-b border-border bg-background/90 px-5 py-4">
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {getInitials(selectedConversation.title)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">
                    {selectedConversation.title ?? 'Messages'}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedConversation.subtitle || 'Conversation'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg">Messages</h3>
                <p className="text-sm text-muted-foreground">
                  Select a conversation
                </p>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {messagesQuery.loading ? (
              <p className="text-sm text-muted-foreground">
                Loading messages...
              </p>
            ) : !selectedConversation ? (
              <EmptyState
                icon={<Send size={24} className="text-muted-foreground" />}
                title="Select a conversation"
                description="Choose a tenant conversation to read and reply."
              />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={<Send size={24} className="text-muted-foreground" />}
                title="No messages yet"
                description="Start the conversation with this tenant."
              />
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMine = Boolean(msg.is_mine);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${
                          isMine
                            ? 'rounded-br-md bg-primary text-primary-foreground'
                            : 'rounded-bl-md border border-border bg-background'
                        }`}
                      >
                        {!isMine ? (
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {msg.sender?.name ?? 'Sender'}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {msg.body}
                        </p>
                        <p
                          className={`mt-2 text-xs ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                        >
                          {formatChatTimestamp(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-4">
            <div className="flex items-end gap-2">
              <textarea
                placeholder="Type a message..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={messageText}
                rows={1}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                aria-label="Send message"
                disabled={
                  !selectedConversationId ||
                  sending ||
                  messageText.trim().length === 0
                }
                onClick={handleSend}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
