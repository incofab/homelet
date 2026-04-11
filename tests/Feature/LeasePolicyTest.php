<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\User;
use App\Policies\LeasePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('building owner admin manager can view leases', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
    ]);

    $policy = new LeasePolicy;

    expect($policy->view($owner, $lease))->toBeTrue();
    expect($policy->view($admin, $lease))->toBeTrue();
    expect($policy->view($manager, $lease))->toBeTrue();
});

test('tenant can view their own lease only', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();
    $otherTenant = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
    ]);

    $policy = new LeasePolicy;

    expect($policy->view($tenant, $lease))->toBeTrue();
    expect($policy->view($otherTenant, $lease))->toBeFalse();
});

test('building owner admin manager can extend and renew leases', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
    ]);

    $policy = new LeasePolicy;

    expect($policy->extend($owner, $lease))->toBeTrue();
    expect($policy->extend($admin, $lease))->toBeTrue();
    expect($policy->extend($manager, $lease))->toBeTrue();
    expect($policy->renew($owner, $lease))->toBeTrue();
    expect($policy->renew($admin, $lease))->toBeTrue();
    expect($policy->renew($manager, $lease))->toBeTrue();
});

test('tenant cannot extend or renew their own lease', function () {
    $tenant = User::factory()->create();

    $lease = Lease::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    $policy = new LeasePolicy;

    expect($policy->extend($tenant, $lease))->toBeFalse();
    expect($policy->renew($tenant, $lease))->toBeFalse();
});
