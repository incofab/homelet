<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\RentalRequest;
use App\Models\User;

class RentalRequestPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

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

        return $user->canManageBuilding($building);
    }

    private function buildingIdsFor(User $user)
    {
        return $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);
    }
}
