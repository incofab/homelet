<?php

namespace App\Policies;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\User;

class MaintenanceRequestPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        if ($user->activeLease()->exists()) {
            return true;
        }

        return $this->buildingIdsFor($user)->isNotEmpty();
    }

    public function create(User $user, Apartment $apartment): bool
    {
        return Lease::query()
            ->where('tenant_id', $user->id)
            ->where('apartment_id', $apartment->id)
            ->where('status', 'active')
            ->exists();
    }

    public function update(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        $building = $maintenanceRequest->apartment?->building;

        if (! $building) {
            return false;
        }

        return $user->canHandleMaintenance($building);
    }

    public function view(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($maintenanceRequest->tenant_id === $user->id) {
            return true;
        }

        return $this->update($user, $maintenanceRequest);
    }

    public function addMedia(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        return $this->view($user, $maintenanceRequest);
    }

    private function buildingIdsFor(User $user)
    {
        return $user->buildingIdsForRoles([
            Building::ROLE_LANDLORD,
            Building::ROLE_MANAGER,
            Building::ROLE_CARETAKER,
        ]);
    }
}
