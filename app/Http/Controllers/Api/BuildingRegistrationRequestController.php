<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingRegistrationRequest;
use App\Models\BuildingRegistrationRequest;
use App\Services\BuildingRegistrationRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuildingRegistrationRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $status = $request->string('status')->toString();

        $query = BuildingRegistrationRequest::query()
            ->where('user_id', $user->id)
            ->latest('id');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $requests = paginateFromRequest($query);

        return $this->success('Building registration requests loaded.', [
            'requests' => $requests,
        ]);
    }

    public function store(
        StoreBuildingRegistrationRequest $request,
        BuildingRegistrationRequestService $buildingRegistrationRequestService
    ): JsonResponse {
        $user = $request->user('sanctum');
        $buildingRequest = $buildingRegistrationRequestService->submit($user, $request->validated());

        return $this->success('Building registration request submitted.', [
            'request' => $buildingRequest,
            'admin_contacts' => config('homelet.platform_admin_contacts'),
        ], 201);
    }

    public function show(
        Request $request,
        BuildingRegistrationRequest $buildingRegistrationRequest
    ): JsonResponse {
        if ($buildingRegistrationRequest->user_id !== $request->user('sanctum')->id) {
            abort(403);
        }

        return $this->success('Building registration request loaded.', [
            'request' => $buildingRegistrationRequest,
        ]);
    }
}
