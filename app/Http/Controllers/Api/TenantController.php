<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\User;
use App\Support\LeaseTimingData;
use App\Support\TenantBalanceData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $actor = $request->user('sanctum');
        $tenants = $this->tenantPaginatorForBuildingIds($this->buildingIdsFor($actor));

        return $this->success('Tenants loaded.', [
            'tenants' => $this->serializeTenantPaginator($tenants),
        ]);
    }

    public function indexForBuilding(Request $request, Building $building): JsonResponse
    {
        $this->authorize('view', $building);

        $tenants = $this->tenantPaginatorForBuildingIds(collect([$building->id]));

        return $this->success('Building tenants loaded.', [
            'building' => $building,
            'tenants' => $this->serializeTenantPaginator($tenants),
        ]);
    }

    public function show(Request $request, User $tenant): JsonResponse
    {
        $this->authorize('view', $tenant);

        if (! $tenant->leases()->exists()) {
            abort(404);
        }

        $leases = $tenant->leases()
            ->with('apartment.building')
            ->orderByDesc('end_date')
            ->orderByDesc('id')
            ->get();

        $payments = $tenant->payments()
            ->latest('id')
            ->get();

        return $this->success('Tenant loaded.', [
            'tenant' => $tenant,
            'leases' => $leases,
            'payments' => $payments,
            'balance' => TenantBalanceData::summarize($leases, $payments),
        ]);
    }

    private function buildingIdsFor(User $user)
    {
        return $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);
    }

    private function tenantPaginatorForBuildingIds($buildingIds)
    {
        return paginateFromRequest(
            User::query()
                ->whereHas('leases.apartment', function ($query) use ($buildingIds) {
                    $query->whereIn('building_id', $buildingIds);
                })
                ->with([
                    'latestLease' => function ($query) {
                        $query->with('apartment.building');
                    },
                ])
                ->latest('id')
        );
    }

    private function serializeTenantPaginator($tenants)
    {
        return $tenants->through(function (User $tenant) {
            $lease = $tenant->latestLease;
            $timing = LeaseTimingData::for($lease);

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'role' => $tenant->role,
                'dashboard' => $tenant->dashboard,
                'current_lease' => $lease ? [
                    'id' => $lease->id,
                    'status' => $lease->status,
                    'start_date' => optional($lease->start_date)->toDateString(),
                    'end_date' => optional($lease->end_date)->toDateString(),
                    'rent_amount' => $lease->rent_amount,
                    'apartment' => $lease->apartment ? [
                        'id' => $lease->apartment->id,
                        'unit_code' => $lease->apartment->unit_code,
                        'building' => $lease->apartment->building ? [
                            'id' => $lease->apartment->building->id,
                            'name' => $lease->apartment->building->name,
                        ] : null,
                    ] : null,
                ] + $timing : null,
                'active_lease' => $lease && $lease->status === 'active' ? [
                    'id' => $lease->id,
                    'status' => $lease->status,
                    'end_date' => optional($lease->end_date)->toDateString(),
                    'rent_amount' => $lease->rent_amount,
                ] : null,
            ];
        });
    }
}
