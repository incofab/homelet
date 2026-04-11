<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lease\ExtendLeaseRequest;
use App\Http\Requests\Lease\RenewLeaseRequest;
use App\Models\Lease;
use App\Services\LeaseLifecycleService;
use Illuminate\Http\JsonResponse;

class LeaseController extends Controller
{
    public function extend(
        ExtendLeaseRequest $request,
        Lease $lease,
        LeaseLifecycleService $leaseLifecycleService
    ): JsonResponse {
        $this->authorize('extend', $lease);

        $extendedLease = $leaseLifecycleService->extend($lease, $request->validated());

        return $this->success('Lease extended.', [
            'lease' => $extendedLease,
            'apartment' => $extendedLease->apartment,
        ]);
    }

    public function renew(
        RenewLeaseRequest $request,
        Lease $lease,
        LeaseLifecycleService $leaseLifecycleService
    ): JsonResponse {
        $this->authorize('renew', $lease);

        $renewal = $leaseLifecycleService->renew($lease, $request->validated());

        return $this->success('Lease renewed.', [
            'previous_lease' => $renewal['previous_lease'],
            'lease' => $renewal['lease'],
            'payment' => $renewal['payment'],
            'apartment' => $renewal['apartment'],
        ], 201);
    }
}
