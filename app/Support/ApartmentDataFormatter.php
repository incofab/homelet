<?php

namespace App\Support;

use App\Models\Apartment;

class ApartmentDataFormatter
{
    public function format(Apartment $apartment): array
    {
        $apartment->load([
            'building',
            'media',
            'leases' => fn ($query) => $query->with('tenant')->latest('start_date'),
        ]);

        $currentLease = $apartment->leases->firstWhere('status', 'active')
            ?? $apartment->leases->first();

        $currentTenant = $currentLease?->tenant ? [
            'id' => $currentLease->tenant->id,
            'name' => $currentLease->tenant->name,
            'email' => $currentLease->tenant->email,
            'phone' => $currentLease->tenant->phone,
            'lease_id' => $currentLease->id,
            'lease_start' => $currentLease->start_date?->toDateString(),
            'lease_end' => $currentLease->end_date?->toDateString(),
            'lease_status' => $currentLease->status,
            'rent_amount' => $currentLease->rent_amount,
        ] : null;

        $payload = $apartment->toArray();
        $payload['current_tenant'] = $currentTenant;
        $payload['tenant'] = $currentTenant;

        return $payload;
    }
}
