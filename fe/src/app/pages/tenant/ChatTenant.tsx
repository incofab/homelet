import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiPost } from '../../lib/api';
import { formatChatTimestamp, getInitials } from '../../lib/format';
import { api } from '../../lib/urls';
import { PaginatedData } from '../../lib/paginatedData';
import type { Conversation, Message } from '../../lib/models';
import type { TenantDashboardResponse } from '../../lib/responses';

export function ChatTenant() {
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
  const tenantDashboardQuery = useApiQuery<TenantDashboardResponse>(
    api.dashboardTenant,
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const conversations = conversationsQuery.data?.items ?? [];
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const activeApartmentId =
    tenantDashboardQuery.data?.active_lease?.apartment_id ?? null;

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

  const headerTitle = selectedConversation?.title ?? 'Property Management';
  const headerSubtitle =
    selectedConversation?.subtitle ??
    tenantDashboardQuery.data?.active_lease?.apartment?.building?.name ??
    tenantDashboardQuery.data?.active_lease?.building_name ??
    '';

  const messages = useMemo(
    () => messagesQuery.data?.items ?? [],
    [messagesQuery.data],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (messageText.trim().length === 0) return;

    setSending(true);

    try {
      let conversationId = selectedConversationId;
      let createdConversation = false;

      if (!conversationId) {
        if (!activeApartmentId) {
          return;
        }

        const data = await apiPost<{ conversation?: { id?: number } }>(
          api.conversations,
          {
            apartment_id: activeApartmentId,
          },
        );

        conversationId = data.conversation?.id ?? null;
        createdConversation = Boolean(conversationId);

        if (conversationId) {
          setSelectedConversationId(conversationId);
        }
      }

      if (!conversationId) {
        return;
      }

      await apiPost(api.conversationMessages(conversationId), {
        body: messageText.trim(),
      });
      setMessageText('');

      if (createdConversation) {
        await conversationsQuery.refetch();
      } else {
        await Promise.all([
          conversationsQuery.refetch(),
          messagesQuery.refetch(),
        ]);
      }
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

      <Card className="h-[600px] flex flex-col overflow-hidden bg-muted/20">
        <div className="border-b border-border bg-background/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {getInitials(headerTitle)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold">{headerTitle}</h3>
              <p className="truncate text-sm text-muted-foreground">
                {headerSubtitle || 'Direct conversation'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {messagesQuery.loading ? (
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<Send size={24} className="text-muted-foreground" />}
              title="No messages yet"
              description="Start the conversation with your manager."
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
                          {msg.sender?.name ?? headerTitle}
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
                sending ||
                messageText.trim().length === 0 ||
                (!selectedConversationId && !activeApartmentId)
              }
              onClick={handleSend}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
