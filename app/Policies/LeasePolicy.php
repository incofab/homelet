<?php

namespace App\Policies;

use App\Models\Lease;
use App\Models\User;

class LeasePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function view(User $user, Lease $lease): bool
    {
        if ($lease->tenant_id === $user->id) {
            return true;
        }

        $building = $lease->apartment?->building;
        if (! $building) {
            return false;
        }

        return $user->canManageBuilding($building);
    }
}
