<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Conversation\StoreConversationRequest;
use App\Http\Requests\Conversation\StoreMessageRequest;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\Lease;
use App\Models\Message;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Conversation::class);

        $user = $request->user('sanctum');

        $conversations = paginateFromRequest(Conversation::query()
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->latest('id'));

        return $this->success('Conversations loaded.', [
            'conversations' => $conversations,
        ]);
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        $this->authorize('create', Conversation::class);

        $buildingId = $request->integer('building_id');
        $apartmentId = $request->integer('apartment_id');

        if (! $buildingId && ! $apartmentId) {
            throw ValidationException::withMessages([
                'building_id' => 'Either building_id or apartment_id is required.',
            ]);
        }

        $apartment = null;
        $building = null;

        if ($apartmentId) {
            $apartment = Apartment::query()->findOrFail($apartmentId);
            $building = $apartment->building;
            $buildingId = $building?->id;
        } elseif ($buildingId) {
            $building = Building::query()->findOrFail($buildingId);
        }

        if ($apartment && $building && $apartment->building_id !== $building->id) {
            throw ValidationException::withMessages([
                'apartment_id' => 'Apartment does not belong to the provided building.',
            ]);
        }

        $actor = $request->user('sanctum');

        $this->ensureActorAllowed($actor, $building, $apartment);

        $participantIds = collect($request->input('participant_ids', []))
            ->push($actor->id)
            ->unique()
            ->values();

        $participants = User::query()
            ->whereIn('id', $participantIds)
            ->get();

        $this->ensureConversationRules(
            $participants,
            $building,
            $apartment
        );

        $conversation = null;

        DB::transaction(function () use (&$conversation, $buildingId, $apartmentId, $participants, $actor): void {
            $conversation = Conversation::query()->create([
                'building_id' => $buildingId,
                'apartment_id' => $apartmentId,
                'created_by' => $actor->id,
            ]);

            $conversation->participants()->sync($participants->modelKeys());
        });

        return $this->success('Conversation created.', [
            'conversation' => $conversation,
        ], 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = paginateFromRequest(
            $conversation->messages()->orderBy('id')
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

        return $this->success('Message sent.', [
            'message' => $message,
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

    private function ensureConversationRules($participants, ?Building $building, ?Apartment $apartment): void
    {
        $buildingId = $building?->id;
        $apartmentId = $apartment?->id;

        $tenantParticipants = $participants->filter(function (User $user) use ($building, $apartment) {
            return $this->isTenantParticipant($user, $building, $apartment);
        });

        if ($tenantParticipants->isNotEmpty()) {
            $eligibleTenants = Lease::query()
                ->where('status', 'active')
                ->whereIn('tenant_id', $tenantParticipants->modelKeys())
                ->when($apartmentId, function ($query) use ($apartmentId) {
                    $query->where('apartment_id', $apartmentId);
                })
                ->when(! $apartmentId && $buildingId, function ($query) use ($buildingId) {
                    $query->whereHas('apartment', function ($subQuery) use ($buildingId) {
                        $subQuery->where('building_id', $buildingId);
                    });
                })
                ->pluck('tenant_id')
                ->unique();

            $missingTenants = $tenantParticipants
                ->whereNotIn('id', $eligibleTenants->all());

            if ($missingTenants->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'participant_ids' => 'Tenant participants must have an active lease for this apartment or building.',
                ]);
            }
        }

        $hasStaff = $participants->contains(function (User $user) use ($buildingId) {
            return $this->hasBuildingAccess($user, $buildingId);
        });

        if (! $hasStaff) {
            throw ValidationException::withMessages([
                'participant_ids' => 'Tenant-to-tenant conversations are not allowed.',
            ]);
        }

        $invalidStaff = $participants->filter(function (User $user) use ($buildingId) {
            if ($this->isTenantParticipant($user, Building::query()->find($buildingId), null)) {
                return false;
            }

            return ! $this->hasBuildingAccess($user, $buildingId);
        });

        if ($invalidStaff->isNotEmpty()) {
            throw ValidationException::withMessages([
                'participant_ids' => 'Some participants are not allowed for this building.',
            ]);
        }
    }

    private function ensureActorAllowed(User $actor, ?Building $building, ?Apartment $apartment): void
    {
        $buildingId = $building?->id;
        $apartmentId = $apartment?->id;

        if ($this->isTenantParticipant($actor, $building, $apartment)) {
            $hasLease = Lease::query()
                ->where('status', 'active')
                ->where('tenant_id', $actor->id)
                ->when($apartmentId, function ($query) use ($apartmentId) {
                    $query->where('apartment_id', $apartmentId);
                })
                ->when(! $apartmentId && $buildingId, function ($query) use ($buildingId) {
                    $query->whereHas('apartment', function ($subQuery) use ($buildingId) {
                        $subQuery->where('building_id', $buildingId);
                    });
                })
                ->exists();

            if (! $hasLease) {
                abort(403);
            }

            return;
        }

        if (! $this->hasBuildingAccess($actor, $buildingId)) {
            abort(403);
        }
    }

    private function hasBuildingAccess(User $user, ?int $buildingId): bool
    {
        if (! $buildingId) {
            return false;
        }

        $building = Building::query()->find($buildingId);

        return $building ? $user->canManageBuilding($building) : false;
    }

    private function isTenantParticipant(User $user, ?Building $building, ?Apartment $apartment): bool
    {
        return Lease::query()
            ->where('status', 'active')
            ->where('tenant_id', $user->id)
            ->when($apartment?->id, function ($query) use ($apartment) {
                $query->where('apartment_id', $apartment->id);
            })
            ->when(! $apartment?->id && $building?->id, function ($query) use ($building) {
                $query->whereHas('apartment', function ($subQuery) use ($building) {
                    $subQuery->where('building_id', $building->id);
                });
            })
            ->exists();
    }
}
