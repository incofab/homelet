<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\RentalRequest;
use App\Models\User;

class RentalRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->buildingIdsFor($user)->isNotEmpty();
    }

    public function update(User $user, RentalRequest $rentalRequest): bool
    {
        $building = $rentalRequest->apartment?->building;

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

    private function buildingIdsFor(User $user)
    {
        $owned = Building::query()->where('owner_id', $user->id)->pluck('id');

        $assigned = $user->buildings()
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->pluck('buildings.id');

        return $owned->merge($assigned)->unique();
    }
}
