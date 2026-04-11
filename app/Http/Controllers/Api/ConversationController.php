<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Conversation\StoreConversationRequest;
use App\Http\Requests\Conversation\StoreMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\ConversationService;
use App\Support\ConversationFormatter;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly ConversationFormatter $conversationFormatter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Conversation::class);

        $user = $request->user('sanctum');

        $conversations = paginateFromRequest(
            Conversation::query()
                ->whereHas('participants', function ($query) use ($user) {
                    $query->where('users.id', $user->id);
                })
                ->with([
                    'apartment.building:id,name',
                    'participants:id,name',
                    'lastMessage.sender:id,name',
                ])
                ->withCount([
                    'messages as unread_count' => function ($query) use ($user) {
                        $query->where('sender_id', '!=', $user->id)
                            ->whereNull('read_at');
                    },
                ])
                ->withMax('messages', 'id')
                ->orderByDesc('messages_max_id')
                ->orderByDesc('id')
        );

        $conversations = $this->conversationFormatter->transformPaginator(
            $conversations,
            fn (Conversation $conversation) => $this->conversationFormatter->formatConversation($conversation, $user)
        );

        return $this->success('Conversations loaded.', [
            'conversations' => $conversations,
        ]);
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        $this->authorize('create', Conversation::class);

        $actor = $request->user('sanctum');
        $conversation = $this->conversationService->create($actor, $request->validated());

        $conversation->load([
            'apartment.building:id,name',
            'participants:id,name',
            'lastMessage.sender:id,name',
        ]);
        $conversation->unread_count = 0;

        return $this->success('Conversation created.', [
            'conversation' => $this->conversationFormatter->formatConversation($conversation, $actor),
        ], 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $user = $request->user('sanctum');

        $messages = paginateFromRequest(
            $conversation->messages()->orderBy('id')
        );

        $messages = $this->conversationFormatter->transformPaginator(
            tap($messages, function (LengthAwarePaginator $paginator): void {
                $paginator->getCollection()->load('sender:id,name');
            }),
            fn (Message $message) => $this->conversationFormatter->formatMessage($message, $user)
        );

        return $this->success('Messages loaded.', [
            'messages' => $messages,
        ]);
    }

    public function storeMessage(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('sendMessage', $conversation);

        $user = $request->user('sanctum');

        $message = $conversation->messages()->create([
            'sender_id' => $user->id,
            'body' => $request->string('body')->toString(),
        ]);
        $message->load('sender:id,name');

        return $this->success('Message sent.', [
            'message' => $this->conversationFormatter->formatMessage($message, $user),
        ], 201);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('markRead', $conversation);

        $user = $request->user('sanctum');

        $updated = Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);

        return $this->success('Conversation marked as read.', [
            'updated' => $updated,
        ]);
    }
}
