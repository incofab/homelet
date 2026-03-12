<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $this->buildingIdsFor($user)->isNotEmpty();
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($payment->tenant_id === $user->id) {
            return true;
        }

        return $this->hasBuildingAccess($user, $payment->lease?->apartment?->building);
    }

    public function create(User $user, Lease $lease, string $paymentMethod): bool
    {
        if ($paymentMethod === 'online') {
            return $lease->tenant_id === $user->id;
        }

        if ($paymentMethod !== 'manual') {
            return false;
        }

        return $this->hasBuildingAccess($user, $lease->apartment?->building);
    }

    public function viewTenantPayments(User $user): bool
    {
        return $user->leases()->exists();
    }

    private function hasBuildingAccess(User $user, ?Building $building): bool
    {
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
