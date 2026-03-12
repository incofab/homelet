<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('owner can create and list apartments for a building', function () {
    $owner = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $payload = [
        'unit_code' => 'A1',
        'type' => 'one_bedroom',
        'yearly_price' => 1200000,
        'status' => 'vacant',
        'is_public' => true,
        'amenities' => ['parking'],
    ];

    Sanctum::actingAs($owner);
    $createResponse = $this->postJson("/api/buildings/{$building->id}/apartments", $payload);

    $createResponse
        ->assertStatus(201)
        ->assertJsonPath('data.apartment.unit_code', 'A1')
        ->assertJsonPath('data.apartment.status', 'vacant')
        ->assertJsonPath('data.apartment.is_public', true);

    $this->assertDatabaseHas('apartments', [
        'building_id' => $building->id,
        'unit_code' => 'A1',
        'status' => 'vacant',
        'is_public' => true,
    ]);

    Sanctum::actingAs($owner);
    $listResponse = $this->getJson("/api/buildings/{$building->id}/apartments");

    $listResponse
        ->assertStatus(200)
        ->assertJsonPath('data.apartments.data.0.unit_code', 'A1');
});

test('manager can update apartment but tenant cannot', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'unit_code' => 'B1',
    ]);

    Sanctum::actingAs($manager);
    $managerResponse = $this->putJson("/api/apartments/{$apartment->id}", [
        'unit_code' => 'B2',
        'status' => 'maintenance',
        'is_public' => false,
    ]);
    $managerResponse
        ->assertStatus(200)
        ->assertJsonPath('data.apartment.unit_code', 'B2')
        ->assertJsonPath('data.apartment.status', 'maintenance')
        ->assertJsonPath('data.apartment.is_public', false);

    $this->assertDatabaseHas('apartments', [
        'id' => $apartment->id,
        'unit_code' => 'B2',
        'status' => 'maintenance',
        'is_public' => false,
    ]);

    Sanctum::actingAs($tenant);
    $tenantResponse = $this->putJson("/api/apartments/{$apartment->id}", ['unit_code' => 'B3']);
    $tenantResponse->assertStatus(403);
});

test('tenant can view only their leased apartment', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();
    $otherTenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    $apartment->tenants()->attach($tenant->id);

    Sanctum::actingAs($tenant);
    $allowedResponse = $this->getJson("/api/apartments/{$apartment->id}");
    $allowedResponse->assertStatus(200);

    Sanctum::actingAs($otherTenant);
    $blockedResponse = $this->getJson("/api/apartments/{$apartment->id}");
    $blockedResponse->assertStatus(403);
});

test('cannot delete apartment with active lease', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    $apartment->tenants()->attach($tenant->id);

    Sanctum::actingAs($owner);
    $response = $this->deleteJson("/api/apartments/{$apartment->id}");

    $response
        ->assertStatus(409)
        ->assertJsonPath('success', false);
});

test('public apartments listing returns only vacant public units with building summary', function () {
    $building = Building::factory()->create();

    Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
        'is_public' => true,
    ]);

    Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'occupied',
        'is_public' => true,
    ]);

    $response = $this->getJson('/api/public/apartments');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.apartments.data')
        ->assertJsonStructure([
            'data' => [
                'apartments' => [
                    'data' => [
                        ['building'],
                    ],
                ],
            ],
        ]);
});
