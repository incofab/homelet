<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $actor = $request->user('sanctum');
        $buildingIds = $this->buildingIdsFor($actor);

        $tenants = paginateFromRequest(User::query()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'tenant');
            })
            ->whereHas('leases.apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->with(['activeLease.apartment.building'])
            ->latest('id'));

        return $this->success('Tenants loaded.', [
            'tenants' => $tenants,
        ]);
    }

    public function show(Request $request, User $tenant): JsonResponse
    {
        $this->authorize('view', $tenant);

        if (! $tenant->hasRole('tenant')) {
            abort(404);
        }

        $leases = $tenant->leases()
            ->with('apartment.building')
            ->latest('id')
            ->get();

        $payments = $tenant->payments()
            ->latest('id')
            ->get();

        return $this->success('Tenant loaded.', [
            'tenant' => $tenant,
            'leases' => $leases,
            'payments' => $payments,
        ]);
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
