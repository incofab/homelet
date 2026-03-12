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
