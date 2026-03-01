<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingManagerRequest;
use App\Models\Building;
use App\Models\Role;
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

        if (! app(BuildingPolicy::class)->manageManagers($actor, $building)) {
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

        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $user->roles()->syncWithoutDetaching([$managerRole->id]);

        $building->users()->syncWithoutDetaching([
            $user->id => ['role_in_building' => 'manager'],
        ]);

        return $this->success('Manager added.', [
            'user' => $user,
        ], 201);
    }

    public function destroy(Building $building, User $user): JsonResponse
    {
        $actor = request()->user('sanctum');

        if (! app(BuildingPolicy::class)->manageManagers($actor, $building)) {
            abort(403);
        }

        $building->users()->detach($user->id);

        return $this->success('Manager removed.');
    }

    private function success(string $message, mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $status);
    }
}
