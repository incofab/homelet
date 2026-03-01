<?php

namespace App\Policies;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\User;

class MaintenanceRequestPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('tenant')) {
            return true;
        }

        return $this->buildingIdsFor($user)->isNotEmpty();
    }

    public function create(User $user, Apartment $apartment): bool
    {
        if (! $user->hasRole('tenant')) {
            return false;
        }

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

        if ($user->id === $building->owner_id) {
            return true;
        }

        return $building->users()
            ->where('users.id', $user->id)
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->exists();
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
        $owned = Building::query()->where('owner_id', $user->id)->pluck('id');

        $assigned = $user->buildings()
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->pluck('buildings.id');

        return $owned->merge($assigned)->unique();
    }
}
