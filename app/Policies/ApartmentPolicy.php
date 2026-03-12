<?php

namespace App\Policies;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\User;

class ApartmentPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function view(User $user, Apartment $apartment): bool
    {
        return $this->hasBuildingAccess($user, $apartment->building)
            || $apartment->tenants()->where('users.id', $user->id)->exists();
    }

    public function viewAny(User $user, Building $building): bool
    {
        return $this->hasBuildingAccess($user, $building);
    }

    public function create(User $user, Building $building): bool
    {
        return $this->hasBuildingAccess($user, $building);
    }

    public function update(User $user, Apartment $apartment): bool
    {
        return $this->hasBuildingAccess($user, $apartment->building);
    }

    public function assignTenant(User $user, Apartment $apartment): bool
    {
        return $this->hasBuildingAccess($user, $apartment->building);
    }

    public function delete(User $user, Apartment $apartment): bool
    {
        return $this->hasBuildingAccess($user, $apartment->building);
    }

    private function hasBuildingAccess(User $user, Building $building): bool
    {
        return $user->canManageBuilding($building);
    }
}
