<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\User;

class BuildingPolicy
{
    public function view(User $user, Building $building): bool
    {
        return $this->isOwner($user, $building)
            || $this->hasRoleInBuilding($user, $building, ['admin', 'manager']);
    }

    public function update(User $user, Building $building): bool
    {
        return $this->isOwner($user, $building)
            || $this->hasRoleInBuilding($user, $building, ['admin', 'manager']);
    }

    public function delete(User $user, Building $building): bool
    {
        return $this->isOwner($user, $building)
            || $this->hasRoleInBuilding($user, $building, ['admin']);
    }

    public function manageManagers(User $user, Building $building): bool
    {
        return $this->isOwner($user, $building)
            || $this->hasRoleInBuilding($user, $building, ['admin']);
    }

    private function isOwner(User $user, Building $building): bool
    {
        return $user->id === $building->owner_id;
    }

    private function hasRoleInBuilding(User $user, Building $building, array $roles): bool
    {
        return $building->users()
            ->where('users.id', $user->id)
            ->wherePivotIn('role_in_building', $roles)
            ->exists();
    }
}
