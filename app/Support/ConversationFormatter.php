<?php

namespace App\Support;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ConversationFormatter
{
    public function transformPaginator(LengthAwarePaginator $paginator, callable $callback): LengthAwarePaginator
    {
        $paginator->setCollection(
            $paginator->getCollection()->map($callback)
        );

        return $paginator;
    }

    public function formatConversation(Conversation $conversation, User $currentUser): array
    {
        $otherParticipants = $conversation->participants
            ->where('id', '!=', $currentUser->id)
            ->values();

        $counterpart = $this->formatCounterpart($otherParticipants);

        return [
            'id' => $conversation->id,
            'building_id' => $conversation->building_id,
            'apartment_id' => $conversation->apartment_id,
            'title' => $counterpart['name'] ?: "Conversation #{$conversation->id}",
            'subtitle' => $this->formatConversationLocation($conversation),
            'unread_count' => (int) ($conversation->unread_count ?? 0),
            'participants' => $conversation->participants
                ->map(fn (User $participant) => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'role' => $participant->role,
                    'is_current_user' => $participant->id === $currentUser->id,
                ])
                ->values(),
            'counterpart' => $counterpart,
            'apartment' => $conversation->apartment ? [
                'id' => $conversation->apartment->id,
                'unit_code' => $conversation->apartment->unit_code,
                'building' => $conversation->apartment->building ? [
                    'id' => $conversation->apartment->building->id,
                    'name' => $conversation->apartment->building->name,
                ] : null,
            ] : null,
            'last_message' => $conversation->lastMessage
                ? $this->formatMessage($conversation->lastMessage, $currentUser)
                : null,
        ];
    }

    public function formatMessage(Message $message, User $currentUser): array
    {
        return [
            'id' => $message->id,
            'body' => $message->body,
            'created_at' => optional($message->created_at)?->toISOString(),
            'read_at' => optional($message->read_at)?->toISOString(),
            'is_mine' => $message->sender_id === $currentUser->id,
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'role' => $message->sender->role,
            ] : null,
        ];
    }

    private function formatCounterpart(Collection $participants): array
    {
        $names = $participants
            ->pluck('name')
            ->filter()
            ->values();

        $primaryParticipant = $participants->first();

        if ($names->isEmpty()) {
            return [
                'id' => null,
                'name' => '',
                'names' => [],
                'count' => 0,
            ];
        }

        $name = $names->count() === 1
            ? $names->first()
            : sprintf('%s +%d', $names->first(), $names->count() - 1);

        return [
            'id' => $primaryParticipant?->id,
            'name' => $name,
            'names' => $names->all(),
            'count' => $names->count(),
        ];
    }

    private function formatConversationLocation(Conversation $conversation): string
    {
        $unitCode = $conversation->apartment?->unit_code;
        $buildingName = $conversation->apartment?->building?->name;

        if ($unitCode && $buildingName) {
            return "{$unitCode} · {$buildingName}";
        }

        return $unitCode ?: ($buildingName ?: '');
    }
}
