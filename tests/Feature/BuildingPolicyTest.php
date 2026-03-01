<?php

use App\Models\Building;
use App\Models\User;
use App\Policies\BuildingPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('building creation auto-attaches owner as admin', function () {
    $owner = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $pivot = $building->users()->where('users.id', $owner->id)->first();

    expect($pivot)->not()->toBeNull();
    expect($pivot->pivot->role_in_building)->toBe('admin');
});

test('building policy enforces owner admin and manager permissions', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $building->users()->attach($admin->id, ['role_in_building' => 'admin']);
    $building->users()->attach($manager->id, ['role_in_building' => 'manager']);

    $policy = new BuildingPolicy();

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
