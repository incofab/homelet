<?php

namespace App\Services;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\Lease;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConversationService
{
    public function create(User $actor, array $payload): Conversation
    {
        $buildingId = (int) ($payload['building_id'] ?? 0);
        $apartmentId = (int) ($payload['apartment_id'] ?? 0);

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
            $buildingId = $building?->id ?? 0;
        } elseif ($buildingId) {
            $building = Building::query()->findOrFail($buildingId);
        }

        if ($apartment && $building && $apartment->building_id !== $building->id) {
            throw ValidationException::withMessages([
                'apartment_id' => 'Apartment does not belong to the provided building.',
            ]);
        }

        $this->ensureActorAllowed($actor, $building, $apartment);

        $participantIds = collect($payload['participant_ids'] ?? []);

        if ($participantIds->isEmpty() && $this->isTenantParticipant($actor, $building, $apartment)) {
            $participantIds = $this->defaultStaffParticipants($building)->pluck('id');
        }

        $participantIds = $participantIds
            ->push($actor->id)
            ->unique()
            ->values();

        $participants = User::query()
            ->whereIn('id', $participantIds)
            ->get();

        $this->ensureConversationRules($participants, $building, $apartment);

        return DB::transaction(function () use ($buildingId, $apartmentId, $participants, $actor): Conversation {
            $conversation = Conversation::query()->create([
                'building_id' => $buildingId ?: null,
                'apartment_id' => $apartmentId ?: null,
                'created_by' => $actor->id,
            ]);

            $conversation->participants()->sync($participants->modelKeys());

            return $conversation;
        });
    }

    private function ensureConversationRules(Collection $participants, ?Building $building, ?Apartment $apartment): void
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
            if ($this->isTenantParticipant($user, $buildingId ? Building::query()->find($buildingId) : null, null)) {
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

    private function defaultStaffParticipants(?Building $building): Collection
    {
        if (! $building) {
            return collect();
        }

        return $building->users()
            ->wherePivotIn('role', [
                Building::ROLE_LANDLORD,
                Building::ROLE_MANAGER,
                Building::ROLE_CARETAKER,
            ])
            ->get()
            ->unique('id')
            ->values();
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
