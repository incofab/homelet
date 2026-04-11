<?php

namespace App\Services;

use App\Models\Lease;
use App\Models\Payment;

class PaymentService
{
    public function record(Lease $lease, array $attributes): Payment
    {
        return Payment::query()->create([
            'lease_id' => $lease->id,
            'tenant_id' => $lease->tenant_id,
            'amount' => $attributes['amount'],
            'payment_method' => $attributes['payment_method'],
            'transaction_reference' => $attributes['transaction_reference'] ?? null,
            'payment_date' => $attributes['payment_date'] ?? null,
            'status' => $attributes['status'] ?? 'paid',
            'metadata' => $attributes['metadata'] ?? null,
        ]);
    }
}
