<?php

use App\Models\Building;
use App\Models\Role;
use App\Models\User;

uses(Tests\TestCase::class)->in('Feature');
uses(Illuminate\Foundation\Testing\RefreshDatabase::class)->in('Feature');

function assignPlatformAdmin(User $user): User
{
    $user->assignRole(Role::findOrCreate(User::ROLE_ADMIN));

    return $user;
}

function assignBuildingRole(Building $building, User $user, string $role): void
{
    $building->assignUserRole($user, $role);
}
