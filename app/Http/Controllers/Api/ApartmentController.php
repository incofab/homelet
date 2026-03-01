<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Apartment\StoreApartmentRequest;
use App\Http\Requests\Apartment\UpdateApartmentRequest;
use App\Models\Apartment;
use App\Models\Building;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApartmentController extends Controller
{
    public function index(Request $request, Building $building): JsonResponse
    {
        $this->authorize('viewAny', [Apartment::class, $building]);

        $apartments = $building->apartments()->latest('id')->get();

        return $this->success('Apartments loaded.', [
            'apartments' => $apartments,
        ]);
    }

    public function store(StoreApartmentRequest $request, Building $building): JsonResponse
    {
        $this->authorize('create', [Apartment::class, $building]);

        $apartment = $building->apartments()->create($request->validated());

        return $this->success('Apartment created.', [
            'apartment' => $apartment,
        ], 201);
    }

    public function show(Request $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('view', $apartment);

        return $this->success('Apartment loaded.', [
            'apartment' => $apartment,
        ]);
    }

    public function update(UpdateApartmentRequest $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('update', $apartment);

        $apartment->update($request->validated());

        return $this->success('Apartment updated.', [
            'apartment' => $apartment->refresh(),
        ]);
    }

    public function destroy(Request $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('delete', $apartment);

        if ($apartment->tenants()->exists() || $apartment->status === 'occupied') {
            return response()->json([
                'success' => false,
                'message' => 'Apartment has an active lease and cannot be deleted.',
                'data' => null,
                'errors' => null,
            ], 409);
        }

        $apartment->delete();

        return $this->success('Apartment deleted.');
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
