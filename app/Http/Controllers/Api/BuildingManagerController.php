<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingManagerRequest;
use App\Models\Building;
use App\Models\User;
use App\Services\BuildingRoleService;
use Illuminate\Http\JsonResponse;

class BuildingManagerController extends Controller
{
    public function store(
        StoreBuildingManagerRequest $request,
        Building $building,
        BuildingRoleService $buildingRoleService
    ): JsonResponse {
        $actor = $request->user('sanctum');
        $role = $request->string('role')->toString();
        $user = $buildingRoleService->assign(
            $building,
            $actor,
            $role,
            $request->string('email')->toString(),
            $request->string('name')->toString(),
        );

        return $this->success('Building role assigned.', [
            'user' => $user,
            'role' => $role,
        ], 201);
    }

    public function destroy(Building $building, User $user, BuildingRoleService $buildingRoleService): JsonResponse
    {
        $actor = request()->user('sanctum');
        $buildingRoleService->remove($building, $actor, $user);

        return $this->success('Building role removed.');
    }
}
