<?php

namespace App\Policies;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\User;

class ApartmentPolicy
{
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
        if ($user->id === $building->owner_id) {
            return true;
        }

        return $building->users()
            ->where('users.id', $user->id)
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->exists();
    }
}
