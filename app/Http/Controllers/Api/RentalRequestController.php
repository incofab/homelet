<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RentalRequest\ApproveRentalRequestRequest;
use App\Http\Requests\RentalRequest\RejectRentalRequestRequest;
use App\Http\Requests\RentalRequest\UpdateRentalRequestRequest;
use App\Models\Building;
use App\Models\RentalRequest;
use App\Services\RentalRequestWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RentalRequest::class);

        $user = $request->user('sanctum');
        $buildingIds = $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);

        $requests = paginateFromRequest(RentalRequest::query()
            ->with(['apartment.building', 'tenant', 'lease'])
            ->whereHas('apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->latest('id'));

        return $this->success('Rental requests loaded.', [
            'rental_requests' => $requests,
        ]);
    }

    public function update(UpdateRentalRequestRequest $request, RentalRequest $rentalRequest): JsonResponse
    {
        $this->authorize('update', $rentalRequest);

        $rentalRequest->update($request->validated());

        return $this->success('Rental request updated.', [
            'rental_request' => $rentalRequest->refresh()->load(['apartment.building', 'tenant', 'lease']),
        ]);
    }

    public function approve(
        ApproveRentalRequestRequest $request,
        RentalRequest $rentalRequest,
        RentalRequestWorkflowService $workflowService
    ): JsonResponse {
        $this->authorize('update', $rentalRequest);

        $result = $workflowService->approve(
            $rentalRequest->loadMissing('apartment.building'),
            $request->user('sanctum'),
            $request->validated()
        );

        return $this->success('Rental request approved.', $result, 201);
    }

    public function reject(
        RejectRentalRequestRequest $request,
        RentalRequest $rentalRequest,
        RentalRequestWorkflowService $workflowService
    ): JsonResponse {
        $this->authorize('update', $rentalRequest);

        $rentalRequest = $workflowService->reject(
            $rentalRequest->loadMissing('apartment.building'),
            $request->user('sanctum'),
            $request->validated()['rejection_reason'] ?? null
        );

        return $this->success('Rental request rejected.', [
            'rental_request' => $rentalRequest,
        ]);
    }
}
