<?php

namespace App\Services;

use App\Models\Lease;
use Illuminate\Support\Carbon;

class LeaseDocumentService
{
    public function buildTenancyAgreement(Lease $lease): string
    {
        $tenant = $lease->tenant;
        $apartment = $lease->apartment;
        $building = $apartment?->building;

        $startDate = optional($lease->start_date)->toDateString();
        $endDate = optional($lease->end_date)->toDateString();
        $rentAmount = number_format($lease->rent_amount ?? 0);

        return implode("\n", [
            'TENANCY AGREEMENT',
            '==================',
            'Tenant: '.($tenant?->name ?? 'N/A').' ('.($tenant?->email ?? 'N/A').')',
            'Building: '.($building?->name ?? 'N/A'),
            'Apartment: '.($apartment?->unit_code ?? 'N/A'),
            'Lease Start: '.$startDate,
            'Lease End: '.$endDate,
            'Annual Rent (kobo): '.$rentAmount,
            '',
            'Terms:',
            '1. Rent is due annually unless otherwise agreed in writing.',
            '2. Maintenance requests must be submitted through the platform.',
            '3. If the lease expires without renewal, a quit notice will be issued automatically and the tenant must vacate within one month of the notice date.',
            '4. All parties agree to abide by applicable local tenancy regulations.',
            '',
            'Generated on: '.Carbon::now()->toDateString(),
        ]);
    }

    public function buildQuitNotice(Lease $lease): string
    {
        $tenant = $lease->tenant;
        $apartment = $lease->apartment;
        $building = $apartment?->building;
        $noticeDate = Carbon::now()->toDateString();
        $vacateBy = Carbon::now()->addMonth()->toDateString();

        return implode("\n", [
            'QUIT NOTICE',
            '==========',
            'Tenant: '.($tenant?->name ?? 'N/A').' ('.($tenant?->email ?? 'N/A').')',
            'Building: '.($building?->name ?? 'N/A'),
            'Apartment: '.($apartment?->unit_code ?? 'N/A'),
            'Notice Date: '.$noticeDate,
            'Vacate By: '.$vacateBy,
            '',
            'Reason: Lease expired without renewal.',
            'You are required to vacate the apartment by the date above.',
        ]);
    }
}
