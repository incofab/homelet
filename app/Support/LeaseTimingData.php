<?php

namespace App\Support;

use App\Models\Lease;
use Illuminate\Support\Carbon;

class LeaseTimingData
{
    public static function for(?Lease $lease): ?array
    {
        if (! $lease) {
            return null;
        }

        $endDate = $lease->end_date;

        if (! $endDate) {
            return [
                'next_due_date' => null,
                'days_remaining' => null,
                'days_exceeded' => null,
                'is_overdue' => false,
            ];
        }

        $signedDays = Carbon::today()->diffInDays($endDate, false);

        return [
            'next_due_date' => $endDate->toDateString(),
            'days_remaining' => $signedDays >= 0 ? $signedDays : null,
            'days_exceeded' => $signedDays < 0 ? abs($signedDays) : null,
            'is_overdue' => $signedDays < 0,
        ];
    }
}
