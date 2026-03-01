<?php

namespace App\Policies;

use App\Models\Lease;
use App\Models\User;

class LeasePolicy
{
    public function view(User $user, Lease $lease): bool
    {
        if ($lease->tenant_id === $user->id) {
            return true;
        }

        $building = $lease->apartment?->building;
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
}
