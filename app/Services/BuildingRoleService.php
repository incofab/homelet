<?php

namespace App\Services;

use App\Models\Building;
use App\Models\User;
use App\Policies\BuildingPolicy;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BuildingRoleService
{
    public function __construct(
        private readonly BuildingPolicy $buildingPolicy,
    ) {}

    public function assign(Building $building, User $actor, string $role, string $email, ?string $name = null): User
    {
        if (! $this->buildingPolicy->manageRoles($actor, $building, $role)) {
            abort(403);
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => trim((string) $name) !== '' ? trim((string) $name) : Str::before($email, '@'),
                'password' => Hash::make(Str::random(16)),
                'phone' => $this->generatePlaceholderPhone(),
            ]
        );

        $building->assignUserRole($user, $role);

        return $user;
    }

    public function remove(Building $building, User $actor, User $user): void
    {
        $assignedRole = $building->users()
            ->where('users.id', $user->id)
            ->value('building_users.role');

        if (! $assignedRole) {
            abort(404);
        }

        if (! $this->buildingPolicy->removeRole($actor, $building, $assignedRole)) {
            abort(403);
        }

        if ($building->owner_id === $user->id && $assignedRole === Building::ROLE_LANDLORD) {
            throw new HttpResponseException($this->primaryLandlordError());
        }

        $building->users()->detach($user->id);
    }

    private function primaryLandlordError(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'The primary landlord cannot be removed from the building.',
            'data' => null,
            'errors' => null,
        ], 422);
    }

    private function generatePlaceholderPhone(): string
    {
        do {
            $phone = '9'.str_pad((string) random_int(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (User::query()->where('phone', $phone)->exists());

        return $phone;
    }
}
