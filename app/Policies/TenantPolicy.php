<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\User;

class TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->buildingIdsFor($user)->isNotEmpty();
    }

    public function view(User $user, User $tenant): bool
    {
        if (! $tenant->hasRole('tenant')) {
            return false;
        }

        $buildingIds = $this->buildingIdsFor($user);

        if ($buildingIds->isEmpty()) {
            return false;
        }

        return $tenant->leases()
            ->whereHas('apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
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
