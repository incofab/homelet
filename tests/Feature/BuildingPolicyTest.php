<?php

use App\Models\Building;
use App\Models\User;
use App\Policies\BuildingPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('building creation auto-attaches owner as landlord', function () {
    $owner = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $pivot = $building->users()->where('users.id', $owner->id)->first();

    expect($pivot)->not()->toBeNull();
    expect($pivot->pivot->role)->toBe(Building::ROLE_LANDLORD);
});

test('building policy enforces landlord manager and platform admin permissions', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();
    assignPlatformAdmin($admin);

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $policy = new BuildingPolicy;

    expect($policy->view($owner, $building))->toBeTrue();
    expect($policy->update($owner, $building))->toBeTrue();
    expect($policy->delete($owner, $building))->toBeTrue();

    expect($policy->view($admin, $building))->toBeTrue();
    expect($policy->update($admin, $building))->toBeTrue();
    expect($policy->delete($admin, $building))->toBeTrue();

    expect($policy->view($manager, $building))->toBeTrue();
    expect($policy->update($manager, $building))->toBeTrue();
    expect($policy->delete($manager, $building))->toBeFalse();

    expect($policy->view($tenant, $building))->toBeFalse();
    expect($policy->update($tenant, $building))->toBeFalse();
    expect($policy->delete($tenant, $building))->toBeFalse();
});
