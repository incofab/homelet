<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;

class ProfileMediaController extends Controller
{
    public function show(): JsonResponse
    {
        $user = request()->user('sanctum');

        $media = $user->profileMedia()->latest('id')->first();

        return $this->success('Profile media loaded.', [
            'media' => $media,
        ]);
    }

    public function store(StoreMediaRequest $request, MediaService $mediaService): JsonResponse
    {
        $user = $request->user('sanctum');

        $mimeType = (string) $request->file('file')->getMimeType();
        if (str_starts_with($mimeType, 'video/')) {
            return response()->json([
                'success' => false,
                'message' => 'Profile photo must be an image.',
                'data' => null,
                'errors' => ['file' => ['Profile photo must be an image.']],
            ], 422);
        }

        $existing = $user->profileMedia()->latest('id')->first();
        if ($existing) {
            $mediaService->delete($existing);
        }

        $media = $mediaService->store(
            $request->file('file'),
            $user,
            'profile',
            $user->id
        );

        return $this->success('Profile photo uploaded.', [
            'media' => $media,
        ], 201);
    }
}
