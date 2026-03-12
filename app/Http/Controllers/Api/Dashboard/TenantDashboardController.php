<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Lease;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TenantDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user->activeLease()->exists()) {
            abort(403);
        }

        $activeLease = Lease::query()
            ->where('tenant_id', $user->id)
            ->where('status', 'active')
            ->latest('id')
            ->first();

        $daysToExpiry = null;
        if ($activeLease?->end_date) {
            $daysToExpiry = Carbon::today()->diffInDays($activeLease->end_date, false);
        }

        $lastPayment = Payment::query()
            ->where('tenant_id', $user->id)
            ->latest('payment_date')
            ->latest('id')
            ->first();

        $paymentSummary = [
            'paid' => Payment::query()
                ->where('tenant_id', $user->id)
                ->where('status', 'paid')
                ->count(),
            'pending' => Payment::query()
                ->where('tenant_id', $user->id)
                ->where('status', 'pending')
                ->count(),
            'failed' => Payment::query()
                ->where('tenant_id', $user->id)
                ->where('status', 'failed')
                ->count(),
        ];

        return $this->success('Tenant dashboard loaded.', [
            'active_lease' => $activeLease,
            'days_to_expiry' => $daysToExpiry,
            'last_payment' => $lastPayment,
            'payment_summary' => $paymentSummary,
        ]);
    }
}
