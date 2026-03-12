<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingRequest;
use App\Http\Requests\Building\UpdateBuildingRequest;
use App\Models\Building;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuildingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Building::query()->with('media')->latest('id');

        if (! $user->isPlatformAdmin()) {
            $query->where(function ($buildingQuery) use ($user) {
                $buildingQuery
                    ->where('owner_id', $user->id)
                    ->orWhereHas('users', function ($query) use ($user) {
                        $query->where('users.id', $user->id);
                    });
            });
        }

        $buildings = paginateFromRequest($query);

        return $this->success('Buildings loaded.', [
            'buildings' => $buildings,
        ]);
    }

    public function store(StoreBuildingRequest $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user || ! $user->isPlatformAdmin()) {
            abort(403);
        }

        $payload = $request->validated();
        $building = Building::create([
            ...$payload,
            'owner_id' => $payload['owner_id'] ?? $user->id,
        ]);

        return $this->success('Building created.', [
            'building' => $building->fresh(),
        ], 201);
    }

    public function show(Request $request, Building $building): JsonResponse
    {
        $this->authorize('view', $building);

        return $this->success('Building loaded.', [
            'building' => $building->load('media'),
        ]);
    }

    public function update(UpdateBuildingRequest $request, Building $building): JsonResponse
    {
        $this->authorize('update', $building);

        $building->update($request->validated());

        return $this->success('Building updated.', [
            'building' => $building->refresh(),
        ]);
    }

    public function destroy(Request $request, Building $building): JsonResponse
    {
        $this->authorize('delete', $building);

        $building->delete();

        return $this->success('Building deleted.');
    }
}
