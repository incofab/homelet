<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\ApproveBuildingRegistrationRequest;
use App\Http\Requests\Building\RejectBuildingRegistrationRequest;
use App\Models\BuildingRegistrationRequest;
use App\Models\User;
use App\Services\BuildingRegistrationRequestService;
use Illuminate\Http\JsonResponse;

class BuildingRegistrationRequestController extends Controller
{
    public function index(): JsonResponse
    {
        $this->ensureAdmin();

        $status = request()->string('status')->toString();

        $query = BuildingRegistrationRequest::query()->latest('id');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $requests = paginateFromRequest($query);

        return $this->success('Building registration requests loaded.', [
            'requests' => $requests,
        ]);
    }

    public function show(BuildingRegistrationRequest $buildingRegistrationRequest): JsonResponse
    {
        $this->ensureAdmin();

        return $this->success('Building registration request loaded.', [
            'request' => $buildingRegistrationRequest,
        ]);
    }

    public function approve(
        ApproveBuildingRegistrationRequest $request,
        BuildingRegistrationRequest $buildingRegistrationRequest,
        BuildingRegistrationRequestService $buildingRegistrationRequestService
    ): JsonResponse {
        $admin = $this->ensureAdmin();

        if ($buildingRegistrationRequest->status !== BuildingRegistrationRequest::STATUS_PENDING) {
            return $this->error('Only pending requests can be approved.', 422);
        }

        $approval = $buildingRegistrationRequestService->approve($buildingRegistrationRequest, $admin);

        return $this->success('Building registration request approved.', [
            'request' => $approval['request'],
            'building' => $approval['building'],
            'owner' => $approval['owner'],
        ]);
    }

    public function reject(
        RejectBuildingRegistrationRequest $request,
        BuildingRegistrationRequest $buildingRegistrationRequest,
        BuildingRegistrationRequestService $buildingRegistrationRequestService
    ): JsonResponse {
        $admin = $this->ensureAdmin();

        if ($buildingRegistrationRequest->status !== BuildingRegistrationRequest::STATUS_PENDING) {
            return $this->error('Only pending requests can be rejected.', 422);
        }

        $rejectedRequest = $buildingRegistrationRequestService->reject(
            $buildingRegistrationRequest,
            $admin,
            $request->string('rejection_reason')->toString(),
        );

        return $this->success('Building registration request rejected.', [
            'request' => $rejectedRequest,
        ]);
    }

    private function ensureAdmin(): User
    {
        $user = request()->user('sanctum');

        if (! $user || ! $user->isPlatformAdmin()) {
            abort(403);
        }

        return $user;
    }

    private function error(string $message, int $status = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], $status);
    }
}
