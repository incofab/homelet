<?php

namespace App\Services;

use App\Models\Apartment;
use App\Models\Lease;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaseLifecycleService
{
    public function __construct(
        private readonly LeaseService $leaseService,
        private readonly PaymentService $paymentService,
    ) {}

    public function extend(Lease $lease, array $data): Lease
    {
        return DB::transaction(function () use ($lease, $data): Lease {
            $lease = Lease::query()
                ->with('apartment.building', 'tenant')
                ->lockForUpdate()
                ->findOrFail($lease->id);

            if ($lease->status !== 'active') {
                throw ValidationException::withMessages([
                    'lease' => ['Only active leases can be extended.'],
                ]);
            }

            $currentEndDate = Carbon::parse($lease->end_date);
            $newEndDate = array_key_exists('new_end_date', $data) && $data['new_end_date']
                ? Carbon::parse($data['new_end_date'])
                : $currentEndDate->copy()->addMonthsNoOverflow((int) $data['duration_in_months']);

            if ($newEndDate->lte($currentEndDate)) {
                throw ValidationException::withMessages([
                    'new_end_date' => ['The new end date must be after the current lease end date.'],
                ]);
            }

            $lease->update([
                'end_date' => $newEndDate->toDateString(),
            ]);

            return $lease->refresh()->load('apartment.building', 'tenant');
        });
    }

    public function renew(Lease $lease, array $data): array
    {
        $previousLease = null;
        $newLease = null;
        $payment = null;
        $apartment = null;

        DB::transaction(function () use ($lease, $data, &$previousLease, &$newLease, &$payment, &$apartment): void {
            $previousLease = Lease::query()
                ->with('apartment.building', 'tenant')
                ->lockForUpdate()
                ->findOrFail($lease->id);

            if (! in_array($previousLease->status, ['active', 'expired'], true)) {
                throw ValidationException::withMessages([
                    'lease' => ['Only active or expired leases can be renewed.'],
                ]);
            }

            $buildingId = $previousLease->apartment?->building_id;

            $hasMoreRecentLeaseInBuilding = Lease::query()
                ->where('tenant_id', $previousLease->tenant_id)
                ->whereKeyNot($previousLease->id)
                ->whereHas('apartment', function ($query) use ($buildingId) {
                    $query->where('building_id', $buildingId);
                })
                ->where(function ($query) use ($previousLease) {
                    $query
                        ->where('end_date', '>', $previousLease->end_date)
                        ->orWhere(function ($nested) use ($previousLease) {
                            $nested
                                ->whereDate('end_date', $previousLease->end_date)
                                ->where('id', '>', $previousLease->id);
                        });
                })
                ->exists();

            if ($hasMoreRecentLeaseInBuilding) {
                throw ValidationException::withMessages([
                    'lease' => ['Only the most recent lease for this building can be renewed.'],
                ]);
            }

            $currentEndDate = Carbon::parse($previousLease->end_date);
            $startDate = array_key_exists('start_date', $data) && $data['start_date']
                ? Carbon::parse($data['start_date'])
                : $currentEndDate->copy()->addDay();

            if ($startDate->lte($currentEndDate)) {
                throw ValidationException::withMessages([
                    'start_date' => ['The renewal start date must be after the current lease end date.'],
                ]);
            }

            $endDate = array_key_exists('end_date', $data) && $data['end_date']
                ? Carbon::parse($data['end_date'])
                : $startDate->copy()->addMonthsNoOverflow((int) $data['duration_in_months']);

            if ($endDate->lte($startDate)) {
                throw ValidationException::withMessages([
                    'end_date' => ['The renewal end date must be after the renewal start date.'],
                ]);
            }

            $previousLease->update([
                'status' => $previousLease->status === 'active' ? 'renewed' : 'expired',
            ]);

            $newLease = $this->leaseService->create([
                'apartment_id' => $previousLease->apartment_id,
                'tenant_id' => $previousLease->tenant_id,
                'rent_amount' => $data['new_rent_amount'] ?? $previousLease->rent_amount,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => 'active',
            ]);

            if (! empty($data['record_payment'])) {
                $paymentDate = isset($data['payment_date']) ? Carbon::parse($data['payment_date']) : null;
                $dueDate = isset($data['payment_due_date'])
                    ? Carbon::parse($data['payment_due_date'])->toDateString()
                    : $paymentDate?->toDateString();

                $payment = $this->paymentService->record($newLease, [
                    'amount' => $data['payment_amount'],
                    'payment_method' => 'manual',
                    'transaction_reference' => $data['payment_reference'] ?? null,
                    'payment_date' => $paymentDate?->toDateString(),
                    'status' => $data['payment_status'] ?? 'paid',
                    'metadata' => [
                        'due_date' => $dueDate,
                    ],
                ]);
            }

            $apartment = Apartment::query()->findOrFail($previousLease->apartment_id);
            $apartment->update([
                'status' => 'occupied',
                'is_public' => false,
            ]);

            $previousLease = $previousLease->refresh()->load('apartment.building', 'tenant');
            $newLease = $newLease->refresh()->load('apartment.building', 'tenant');
            $payment?->refresh();
            $apartment = $apartment->refresh()->load('building');
        });

        return [
            'previous_lease' => $previousLease,
            'lease' => $newLease,
            'payment' => $payment,
            'apartment' => $apartment,
        ];
    }
}
