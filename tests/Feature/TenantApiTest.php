<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can list tenants scoped to managed buildings', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(12)->toDateString(),
    ]);

    $otherTenant = User::factory()->create();
    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => $otherTenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);
    $response = $this->getJson('/api/tenants');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data.tenants.data')
        ->assertJsonFragment([
            'id' => $tenant->id,
            'name' => $tenant->name,
        ])
        ->assertJsonFragment([
            'id' => $lease->id,
            'next_due_date' => Carbon::today()->addDays(12)->toDateString(),
            'days_remaining' => 12,
            'days_exceeded' => null,
        ]);
});

test('building managers can list tenants for a specific building with overdue timing', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();
    $otherTenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $otherApartment = Apartment::factory()->create();

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'expired',
        'end_date' => Carbon::today()->subDays(5)->toDateString(),
    ]);

    Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => $otherTenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->getJson("/api/buildings/{$building->id}/tenants");

    $response->assertStatus(200)
        ->assertJsonPath('data.building.id', $building->id)
        ->assertJsonCount(1, 'data.tenants.data')
        ->assertJsonPath('data.tenants.data.0.id', $tenant->id)
        ->assertJsonPath('data.tenants.data.0.current_lease.id', $lease->id)
        ->assertJsonPath('data.tenants.data.0.current_lease.days_remaining', null)
        ->assertJsonPath('data.tenants.data.0.current_lease.days_exceeded', 5)
        ->assertJsonPath('data.tenants.data.0.current_lease.is_overdue', true);
});

test('admin can view tenant details for managed building', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $olderLease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 1200000,
        'status' => 'expired',
        'end_date' => '2025-12-31',
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'rent_amount' => 1500000,
        'end_date' => '2026-12-31',
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'amount' => 400000,
        'status' => 'paid',
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'amount' => 250000,
        'status' => 'pending',
    ]);

    Sanctum::actingAs($admin);
    $response = $this->getJson("/api/tenants/{$tenant->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.tenant.id', $tenant->id)
        ->assertJsonCount(2, 'data.leases')
        ->assertJsonPath('data.leases.0.id', $lease->id)
        ->assertJsonPath('data.leases.1.id', $olderLease->id)
        ->assertJsonCount(2, 'data.payments')
        ->assertJsonPath('data.balance.total_lease_rent', 2700000)
        ->assertJsonPath('data.balance.total_paid', 400000)
        ->assertJsonPath('data.balance.outstanding_balance', 2300000);
});

test('tenant cannot list tenants', function () {
    $tenant = User::factory()->create();

    Sanctum::actingAs($tenant);
    $response = $this->getJson('/api/tenants');

    $response->assertStatus(403);
});

test('platform admin can view tenant outside managed buildings', function () {
    $admin = assignPlatformAdmin(User::factory()->create());
    $tenant = User::factory()->create();

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);
    $response = $this->getJson("/api/tenants/{$tenant->id}");

    $response->assertStatus(200);
});
