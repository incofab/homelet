<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Models\Building;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;

class BuildingMediaController extends Controller
{
    public function index(Building $building): JsonResponse
    {
        $this->authorize('view', $building);

        return $this->success('Building media loaded.', [
            'media' => paginateFromRequest($building->media()->latest('id')),
        ]);
    }

    public function store(StoreMediaRequest $request, Building $building, MediaService $mediaService): JsonResponse
    {
        $this->authorize('update', $building);

        $collection = $request->string('collection', 'images')->toString();

        $media = $mediaService->store(
            $request->file('file'),
            $building,
            $collection,
            $request->user('sanctum')->id
        );

        return $this->success('Building media uploaded.', [
            'media' => $media,
        ], 201);
    }
}
