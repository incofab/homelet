<?php

namespace App\Services;

use App\Jobs\SendTenancyAgreementEmail;
use App\Models\Apartment;
use App\Models\Lease;
use App\Support\TenantResolver;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TenantAssignmentService
{
    public function __construct(
        private readonly LeaseService $leaseService,
        private readonly PaymentService $paymentService,
        private readonly TenantResolver $tenantResolver,
    ) {}

    /**
     * Assign a tenant to an apartment.
     *
     * @param Apartment $apartment
     * @param array {
     *      'tenant_email' => string|null,
     *      'tenant_phone' => string|null,
     *      'tenant_name' => string|null,
     *      'start_date' => string,
     *      'rent_amount' => int|null,
     *      'record_payment' => bool,
     *      'payment_amount' => int,
     *      'payment_date' => string|null,
     *      'payment_due_date' => string|null,
     *      'payment_reference' => string|null,
     *      'payment_status' => string,
     *      'metadata' => array,
     * } $data 
     * @return array
     */
    public function assign(Apartment $apartment, array $data): array
    {
        $tenant = null;
        $lease = null;
        $payment = null;

        DB::transaction(function () use ($apartment, $data, &$tenant, &$lease, &$payment): void {
            $tenant = $this->tenantResolver->resolveForAssignment(
                $data['tenant_email'] ?? null,
                $data['tenant_phone'],
                $data['tenant_name'] ?? null,
            );

            $apartment->tenants()->syncWithoutDetaching([$tenant->id]);

            $startDate = Carbon::parse($data['start_date']);
            $rentAmount = $data['rent_amount'] ?? $apartment->yearly_price;

            $lease = $this->leaseService->create([
                'apartment_id' => $apartment->id,
                'tenant_id' => $tenant->id,
                'rent_amount' => $rentAmount,
                'start_date' => $startDate->toDateString(),
                'end_date' => $startDate->copy()->addYear()->toDateString(),
                'status' => 'active',
            ]);

            if (! empty($data['record_payment'])) {
                $paymentDate = isset($data['payment_date']) ? Carbon::parse($data['payment_date']) : null;
                $dueDate = isset($data['payment_due_date'])
                    ? Carbon::parse($data['payment_due_date'])->toDateString()
                    : $paymentDate?->toDateString();

                $payment = $this->paymentService->record($lease, [
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

            $apartment->update(['status' => 'occupied']);
        });

        if ($lease instanceof Lease) {
            SendTenancyAgreementEmail::dispatch($lease);
        }

        return [
            'tenant' => $tenant,
            'lease' => $lease,
            'payment' => $payment,
        ];
    }
}
