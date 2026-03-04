<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can list tenants scoped to managed buildings', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $tenant = User::factory()->create();

    $tenantRole = Role::firstOrCreate(['name' => 'tenant']);
    $tenant->roles()->syncWithoutDetaching([$tenantRole->id]);

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $building->users()->attach($admin->id, ['role_in_building' => 'admin']);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $otherTenant = User::factory()->create();
    $otherTenant->roles()->syncWithoutDetaching([$tenantRole->id]);
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
        ->assertJsonCount(1, 'data.tenants.data');
});

test('admin can view tenant details for managed building', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $tenant = User::factory()->create();

    $tenantRole = Role::firstOrCreate(['name' => 'tenant']);
    $tenant->roles()->syncWithoutDetaching([$tenantRole->id]);

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $building->users()->attach($admin->id, ['role_in_building' => 'admin']);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
    ]);

    Sanctum::actingAs($admin);
    $response = $this->getJson("/api/tenants/{$tenant->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.tenant.id', $tenant->id)
        ->assertJsonCount(1, 'data.leases')
        ->assertJsonCount(1, 'data.payments');
});

test('tenant cannot list tenants', function () {
    $tenant = User::factory()->create();
    $tenantRole = Role::firstOrCreate(['name' => 'tenant']);
    $tenant->roles()->syncWithoutDetaching([$tenantRole->id]);

    Sanctum::actingAs($tenant);
    $response = $this->getJson('/api/tenants');

    $response->assertStatus(403);
});

test('admin cannot view tenant outside managed buildings', function () {
    $admin = User::factory()->create();
    $tenant = User::factory()->create();

    $tenantRole = Role::firstOrCreate(['name' => 'tenant']);
    $tenant->roles()->syncWithoutDetaching([$tenantRole->id]);

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);
    $response = $this->getJson("/api/tenants/{$tenant->id}");

    $response->assertStatus(403);
});
