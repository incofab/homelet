<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Models\Apartment;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;

class ApartmentMediaController extends Controller
{
    public function index(Apartment $apartment): JsonResponse
    {
        $this->authorize('view', $apartment);

        return $this->success('Apartment media loaded.', [
            'media' => paginateFromRequest($apartment->media()->latest('id')),
        ]);
    }

    public function store(StoreMediaRequest $request, Apartment $apartment, MediaService $mediaService): JsonResponse
    {
        $this->authorize('update', $apartment);

        $collection = $request->string('collection', 'images')->toString();

        $media = $mediaService->store(
            $request->file('file'),
            $apartment,
            $collection,
            $request->user('sanctum')->id
        );

        return $this->success('Apartment media uploaded.', [
            'media' => $media,
        ], 201);
    }

    public function destroy(Apartment $apartment, Media $media, MediaService $mediaService): JsonResponse
    {
        $this->authorize('update', $apartment);

        abort_unless(
            $media->model_type === $apartment::class && (int) $media->model_id === (int) $apartment->id,
            404
        );

        $mediaService->delete($media);

        return $this->success('Apartment media deleted.');
    }
}
