<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use Illuminate\Http\JsonResponse;

class PublicBuildingController extends Controller
{
    public function index(): JsonResponse
    {
        $buildings = paginateFromRequest(
            Building::query()
                ->whereHas('apartments', function ($query) {
                    $query->where('is_public', true);
                })
                ->with(['media'])
                ->withCount([
                    'apartments as public_apartments_count' => function ($query) {
                        $query->where('is_public', true);
                    },
                ])
                ->latest('id')
        );

        return $this->success('Public buildings loaded.', [
            'buildings' => $buildings,
        ]);
    }

    public function show(Building $building): JsonResponse
    {
        $building->load([
            'media',
            'apartments' => function ($query) {
                $query->where('is_public', true)
                    ->with('media')
                    ->latest('id');
            },
        ]);

        abort_if($building->apartments->isEmpty(), 404);

        return $this->success('Public building loaded.', [
            'building' => $building,
        ]);
    }
}
