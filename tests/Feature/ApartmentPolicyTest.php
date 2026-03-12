<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\User;
use App\Policies\ApartmentPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('building owner admin manager can crud apartments', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $manager = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
    ]);

    $policy = new ApartmentPolicy;

    expect($policy->create($owner, $building))->toBeTrue();
    expect($policy->update($owner, $apartment))->toBeTrue();
    expect($policy->delete($owner, $apartment))->toBeTrue();

    expect($policy->create($admin, $building))->toBeTrue();
    expect($policy->update($admin, $apartment))->toBeTrue();
    expect($policy->delete($admin, $apartment))->toBeTrue();

    expect($policy->create($manager, $building))->toBeTrue();
    expect($policy->update($manager, $apartment))->toBeTrue();
    expect($policy->delete($manager, $apartment))->toBeTrue();
});

test('tenant can only view their leased apartment', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();
    $otherTenant = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
    ]);

    $apartment->tenants()->attach($tenant->id);

    $policy = new ApartmentPolicy;

    expect($policy->view($tenant, $apartment))->toBeTrue();
    expect($policy->update($tenant, $apartment))->toBeFalse();
    expect($policy->delete($tenant, $apartment))->toBeFalse();

    expect($policy->view($otherTenant, $apartment))->toBeFalse();
});
