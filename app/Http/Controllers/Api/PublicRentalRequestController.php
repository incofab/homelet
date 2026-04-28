<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RentalRequest\StoreRentalRequestPublicRequest;
use App\Models\Apartment;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;

class PublicRentalRequestController extends Controller
{
    public function showApartment(Apartment $apartment): JsonResponse
    {
        $apartment->load([
            'building:id,name,address_id,contact_email,contact_phone',
            'building.address',
            'media',
            'reviews.user:id,name',
        ]);

        $isAvailable = $apartment->status === 'vacant';

        return $this->success('Rental request apartment loaded.', [
            'apartment' => $apartment,
            'can_request' => $isAvailable,
            'unavailable_message' => $isAvailable
                ? null
                : 'This apartment is no longer available for rental requests. Please contact the landlord or manager for another option.',
        ]);
    }

    public function store(StoreRentalRequestPublicRequest $request): JsonResponse
    {
        $rentalRequest = RentalRequest::query()->create($request->validated());

        return $this->success('Rental request submitted.', [
            'rental_request' => $rentalRequest,
        ], 201);
    }
}
