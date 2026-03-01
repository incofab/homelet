<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Models\MaintenanceRequest;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;

class MaintenanceRequestMediaController extends Controller
{
    public function index(MaintenanceRequest $maintenanceRequest): JsonResponse
    {
        $this->authorize('view', $maintenanceRequest);

        return $this->success('Maintenance request media loaded.', [
            'media' => $maintenanceRequest->media()->latest('id')->get(),
        ]);
    }

    public function store(StoreMediaRequest $request, MaintenanceRequest $maintenanceRequest, MediaService $mediaService): JsonResponse
    {
        $this->authorize('addMedia', $maintenanceRequest);

        $collection = $request->string('collection', 'images')->toString();

        $media = $mediaService->store(
            $request->file('file'),
            $maintenanceRequest,
            $collection,
            $request->user('sanctum')->id
        );

        return $this->success('Maintenance request media uploaded.', [
            'media' => $media,
        ], 201);
    }
}
