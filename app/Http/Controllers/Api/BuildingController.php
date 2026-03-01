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

        $buildings = paginateFromRequest(Building::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('users', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->with('media')
            ->latest('id'));

        return $this->success('Buildings loaded.', [
            'buildings' => $buildings,
        ]);
    }

    public function store(StoreBuildingRequest $request): JsonResponse
    {
        $building = Building::create(array_merge(
            $request->validated(),
            ['owner_id' => $request->user()->id]
        ));

        return $this->success('Building created.', [
            'building' => $building,
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
