<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Models\Building;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;

class BuildingMediaController extends Controller
{
    public function index(Building $building): JsonResponse
    {
        $this->authorize('view', $building);

        return $this->success('Building media loaded.', [
            'media' => paginateFromRequest($building->media()),
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

    public function destroy(Building $building, Media $media, MediaService $mediaService): JsonResponse
    {
        $this->authorize('update', $building);

        abort_unless(
            $media->model_type === $building::class && (int) $media->model_id === (int) $building->id,
            404
        );

        $mediaService->delete($media);

        return $this->success('Building media deleted.');
    }
}
