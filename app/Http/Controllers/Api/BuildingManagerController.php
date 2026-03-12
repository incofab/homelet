<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingManagerRequest;
use App\Models\Building;
use App\Models\User;
use App\Policies\BuildingPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BuildingManagerController extends Controller
{
    public function store(StoreBuildingManagerRequest $request, Building $building): JsonResponse
    {
        $actor = $request->user('sanctum');
        $role = $request->string('role')->toString();

        if (! app(BuildingPolicy::class)->manageRoles($actor, $building, $role)) {
            abort(403);
        }

        $email = $request->string('email')->toString();
        $name = $request->string('name')->toString();

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name !== '' ? $name : Str::before($email, '@'),
                'password' => Hash::make(Str::random(16)),
            ]
        );

        $building->assignUserRole($user, $role);

        return $this->success('Building role assigned.', [
            'user' => $user,
            'role' => $role,
        ], 201);
    }

    public function destroy(Building $building, User $user): JsonResponse
    {
        $actor = request()->user('sanctum');
        $assignedRole = $building->users()
            ->where('users.id', $user->id)
            ->value('building_users.role');

        if (! $assignedRole) {
            abort(404);
        }

        if (! app(BuildingPolicy::class)->removeRole($actor, $building, $assignedRole)) {
            abort(403);
        }

        if ($building->owner_id === $user->id && $assignedRole === Building::ROLE_LANDLORD) {
            return response()->json([
                'success' => false,
                'message' => 'The primary landlord cannot be removed from the building.',
                'data' => null,
                'errors' => null,
            ], 422);
        }

        $building->users()->detach($user->id);

        return $this->success('Building role removed.');
    }
}
