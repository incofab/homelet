<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Models\Apartment;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;

class ApartmentMediaController extends Controller
{
    public function index(Apartment $apartment): JsonResponse
    {
        $this->authorize('view', $apartment);

        return $this->success('Apartment media loaded.', [
            'media' => $apartment->media()->latest('id')->get(),
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
}
