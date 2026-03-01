<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RentalRequest\StoreRentalRequestPublicRequest;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;

class PublicRentalRequestController extends Controller
{
    public function store(StoreRentalRequestPublicRequest $request): JsonResponse
    {
        $rentalRequest = RentalRequest::query()->create($request->validated());

        return $this->success('Rental request submitted.', [
            'rental_request' => $rentalRequest,
        ], 201);
    }

    private function success(string $message, mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $status);
    }
}
