<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\User;

class BuildingPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function view(User $user, Building $building): bool
    {
        return $user->canViewBuilding($building);
    }

    public function update(User $user, Building $building): bool
    {
        return $user->canManageBuilding($building);
    }

    public function delete(User $user, Building $building): bool
    {
        return $user->hasBuildingRole($building, Building::ROLE_LANDLORD);
    }

    public function manageRoles(User $user, Building $building, ?string $role = null): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        return $user->hasBuildingRole($building, Building::ROLE_LANDLORD);
    }

    public function removeRole(User $user, Building $building, string $role): bool
    {
        if ($role === Building::ROLE_LANDLORD) {
            return $user->id === $building->owner_id;
        }

        if ($user->isPlatformAdmin()) {
            return true;
        }

        return $this->manageRoles($user, $building, $role);
    }
}
