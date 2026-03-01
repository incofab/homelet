<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Payment::class);

        $user = $request->user('sanctum');
        $buildingIds = $user->buildings()
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->pluck('buildings.id')
            ->merge(
                Building::query()->where('owner_id', $user->id)->pluck('id')
            )
            ->unique()
            ->values();

        $payments = paginateFromRequest(Payment::query()
            ->whereHas('lease.apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->latest('id'));

        return $this->success('Payments loaded.', [
            'payments' => $payments,
        ]);
    }

    public function tenantIndex(Request $request): JsonResponse
    {
        $this->authorize('viewTenantPayments', Payment::class);

        $user = $request->user('sanctum');

        $payments = paginateFromRequest(Payment::query()
            ->where('tenant_id', $user->id)
            ->latest('id'));

        return $this->success('Payments loaded.', [
            'payments' => $payments,
        ]);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $lease = Lease::query()->findOrFail($request->integer('lease_id'));
        $paymentMethod = $request->string('payment_method')->toString();

        $this->authorize('create', [Payment::class, $lease, $paymentMethod]);

        $payment = Payment::query()->create([
            'lease_id' => $lease->id,
            'tenant_id' => $lease->tenant_id,
            'amount' => $request->integer('amount'),
            'payment_method' => $paymentMethod,
            'transaction_reference' => $request->input('transaction_reference'),
            'payment_date' => $request->date('payment_date')->toDateString(),
            'status' => $request->input('status', 'paid'),
            'metadata' => $request->input('metadata'),
        ]);

        return $this->success('Payment recorded.', [
            'payment' => $payment,
        ], 201);
    }

}
