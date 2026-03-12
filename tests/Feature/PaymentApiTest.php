<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('tenant can pay own lease', function () {
    $tenant = User::factory()->create();

    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->postJson('/api/payments', [
        'lease_id' => $lease->id,
        'amount' => 150_000,
        'payment_method' => 'online',
        'payment_date' => now()->toDateString(),
        'status' => 'paid',
    ]);

    $response->assertStatus(201);
    expect(Payment::where('lease_id', $lease->id)->count())->toBe(1);
});

test('manager can record manual payment for building lease', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($manager);

    $response = $this->postJson('/api/payments', [
        'lease_id' => $lease->id,
        'amount' => 200_000,
        'payment_method' => 'manual',
        'payment_date' => now()->toDateString(),
        'status' => 'paid',
    ]);

    $response->assertStatus(201);
    expect(Payment::where('lease_id', $lease->id)->count())->toBe(1);
});

test('tenant cannot record manual payment', function () {
    $tenant = User::factory()->create();

    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->postJson('/api/payments', [
        'lease_id' => $lease->id,
        'amount' => 200_000,
        'payment_method' => 'manual',
        'payment_date' => now()->toDateString(),
        'status' => 'paid',
    ]);

    $response->assertStatus(403);
});

test('payments index is scoped for admins and tenant endpoint is scoped to tenant', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);

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

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    $otherLease = Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => User::factory()->create()->id,
        'status' => 'active',
    ]);

    Payment::factory()->create([
        'lease_id' => $otherLease->id,
        'tenant_id' => $otherLease->tenant_id,
    ]);

    Sanctum::actingAs($admin);
    $adminResponse = $this->getJson('/api/payments');
    $adminResponse->assertStatus(200)->assertJsonCount(2, 'data.payments.data');

    Sanctum::actingAs($tenant);
    $tenantResponse = $this->getJson('/api/tenant/payments');
    $tenantResponse->assertStatus(200)->assertJsonCount(1, 'data.payments.data');
});
