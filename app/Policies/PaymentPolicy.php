<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
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
        return $user->hasRole('tenant');
    }

    private function hasBuildingAccess(User $user, ?Building $building): bool
    {
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

    private function buildingIdsFor(User $user)
    {
        $owned = Building::query()->where('owner_id', $user->id)->pluck('id');

        $assigned = $user->buildings()
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->pluck('buildings.id');

        return $owned->merge($assigned)->unique();
    }
}
