<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\User;

class TenantPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $this->buildingIdsFor($user)->isNotEmpty();
    }

    public function view(User $user, User $tenant): bool
    {
        if (! $tenant->leases()->where('status', 'active')->exists()) {
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
        return $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);
    }
}
