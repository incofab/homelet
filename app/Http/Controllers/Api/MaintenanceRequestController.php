<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaintenanceRequest\StoreMaintenanceRequest;
use App\Http\Requests\MaintenanceRequest\UpdateMaintenanceRequest;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\MaintenanceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', MaintenanceRequest::class);

        $user = $request->user('sanctum');

        if ($user->activeLease()->exists()) {
            $requests = paginateFromRequest(MaintenanceRequest::query()
                ->where('tenant_id', $user->id)
                ->with('media')
                ->latest('id'));

            return $this->success('Maintenance requests loaded.', [
                'maintenance_requests' => $requests,
            ]);
        }

        $buildingIds = $user->buildingIdsForRoles([
            Building::ROLE_LANDLORD,
            Building::ROLE_MANAGER,
            Building::ROLE_CARETAKER,
        ]);

        $requests = paginateFromRequest(MaintenanceRequest::query()
            ->whereHas('apartment', function ($query) use ($buildingIds) {
                $query->whereIn('building_id', $buildingIds);
            })
            ->with('media')
            ->latest('id'));

        return $this->success('Maintenance requests loaded.', [
            'maintenance_requests' => $requests,
        ]);
    }

    public function store(StoreMaintenanceRequest $request): JsonResponse
    {
        $apartment = Apartment::query()->findOrFail($request->integer('apartment_id'));

        $this->authorize('create', [MaintenanceRequest::class, $apartment]);

        $maintenanceRequest = MaintenanceRequest::query()->create([
            'apartment_id' => $apartment->id,
            'tenant_id' => $request->user('sanctum')->id,
            'title' => $request->string('title')->toString(),
            'description' => $request->string('description')->toString(),
            'status' => 'open',
        ]);

        return $this->success('Maintenance request created.', [
            'maintenance_request' => $maintenanceRequest->load('media'),
        ], 201);
    }

    public function update(UpdateMaintenanceRequest $request, MaintenanceRequest $maintenanceRequest): JsonResponse
    {
        $this->authorize('update', $maintenanceRequest);

        $maintenanceRequest->update($request->validated());

        return $this->success('Maintenance request updated.', [
            'maintenance_request' => $maintenanceRequest->refresh()->load('media'),
        ]);
    }
}
