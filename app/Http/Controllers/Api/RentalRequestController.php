<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RentalRequest\UpdateRentalRequestRequest;
use App\Models\Building;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RentalRequest::class);

        $user = $request->user('sanctum');
        $buildingIds = $user->buildings()
            ->wherePivotIn('role_in_building', ['admin', 'manager'])
            ->pluck('buildings.id')
            ->merge(Building::query()->where('owner_id', $user->id)->pluck('id'))
            ->unique()
            ->values();

        $requests = paginateFromRequest(RentalRequest::query()
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
            'rental_request' => $rentalRequest->refresh(),
        ]);
    }

}
