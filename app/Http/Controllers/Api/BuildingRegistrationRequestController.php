<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingRegistrationRequest;
use App\Services\BuildingRegistrationRequestService;
use Illuminate\Http\JsonResponse;

class BuildingRegistrationRequestController extends Controller
{
    public function store(
        StoreBuildingRegistrationRequest $request,
        BuildingRegistrationRequestService $buildingRegistrationRequestService
    ): JsonResponse {
        $user = $request->user('sanctum');
        $buildingRequest = $buildingRegistrationRequestService->submit($user, $request->validated());

        return $this->success('Building registration request submitted.', [
            'request' => $buildingRequest,
        ], 201);
    }
}
