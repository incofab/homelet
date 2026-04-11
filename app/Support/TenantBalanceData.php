<?php

namespace App\Support;

use Illuminate\Support\Collection;

class TenantBalanceData
{
    public static function summarize(Collection $leases, Collection $payments): array
    {
        $totalLeaseRent = (float) $leases->sum(function ($lease): float {
            return (float) ($lease->rent_amount ?? 0);
        });

        $totalPaid = (float) $payments
            ->where('status', 'paid')
            ->sum(function ($payment): float {
                return (float) ($payment->amount ?? 0);
            });

        return [
            'total_lease_rent' => $totalLeaseRent,
            'total_paid' => $totalPaid,
            'outstanding_balance' => max($totalLeaseRent - $totalPaid, 0),
        ];
    }
}
