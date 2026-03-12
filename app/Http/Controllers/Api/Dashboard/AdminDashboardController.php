<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $buildingIds = $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);

        if ($buildingIds->isEmpty()) {
            abort(403);
        }

        $buildingsCount = Building::query()->whereIn('id', $buildingIds)->count();
        $apartmentsQuery = Apartment::query()->whereIn('building_id', $buildingIds);
        $apartmentsCount = (clone $apartmentsQuery)->count();
        $vacantCount = (clone $apartmentsQuery)->where('status', 'vacant')->count();
        $occupiedCount = (clone $apartmentsQuery)->where('status', 'occupied')->count();

        $expiringLeaseCount = Lease::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<=', Carbon::today()->addDays(90))
            ->whereHas('apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->count();

        $totalIncomePaid = Payment::query()
            ->where('status', 'paid')
            ->whereHas('lease.apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->sum('amount');

        $pendingPayments = Payment::query()
            ->where('status', 'pending')
            ->whereHas('lease.apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->count();

        return $this->success('Admin dashboard loaded.', [
            'counts' => [
                'buildings' => $buildingsCount,
                'apartments' => $apartmentsCount,
                'vacant' => $vacantCount,
                'occupied' => $occupiedCount,
            ],
            'expiring_leases_next_90_days' => $expiringLeaseCount,
            'total_income_paid' => $totalIncomePaid,
            'pending_payments' => $pendingPayments,
        ]);
    }
}
