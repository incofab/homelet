<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('tenant can create maintenance request for their apartment', function () {
    $tenant = User::factory()->create();

    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->postJson('/api/maintenance-requests', [
        'apartment_id' => $apartment->id,
        'title' => 'Leaking pipe',
        'description' => 'Pipe under sink is leaking.',
        'priority' => 'high',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.maintenance_request.status', 'open')
        ->assertJsonPath('data.maintenance_request.priority', 'high');

    expect(MaintenanceRequest::where('tenant_id', $tenant->id)->count())->toBe(1)
        ->and(MaintenanceRequest::where('tenant_id', $tenant->id)->first()?->priority)->toBe('high');
});

test('tenant can show own maintenance request with media and relations', function () {
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['name' => 'Skyline']);
    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'unit_code' => 'B2',
    ]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $request = MaintenanceRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'title' => 'Leaky faucet',
        'priority' => 'medium',
    ]);

    Media::factory()->create([
        'model_type' => MaintenanceRequest::class,
        'model_id' => $request->id,
        'collection' => 'images',
        'created_by' => $tenant->id,
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->getJson("/api/maintenance-requests/{$request->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.maintenance_request.title', 'Leaky faucet')
        ->assertJsonPath('data.maintenance_request.priority', 'medium')
        ->assertJsonPath('data.maintenance_request.apartment.unit_code', 'B2')
        ->assertJsonPath('data.maintenance_request.apartment.building.name', 'Skyline')
        ->assertJsonCount(1, 'data.maintenance_request.media');
});

test('tenant cannot create maintenance request for other apartment', function () {
    $tenant = User::factory()->create();

    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Sanctum::actingAs($tenant);
    $response = $this->postJson('/api/maintenance-requests', [
        'apartment_id' => $apartment->id,
        'title' => 'No power',
        'description' => 'Lights are out.',
    ]);

    $response->assertStatus(403);
});

test('admin can list maintenance requests scoped to building', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    MaintenanceRequest::factory()->create(['apartment_id' => $apartment->id]);

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    MaintenanceRequest::factory()->create(['apartment_id' => $otherApartment->id]);

    Sanctum::actingAs($admin);
    $response = $this->getJson('/api/maintenance-requests');

    $response->assertStatus(200)->assertJsonCount(2, 'data.maintenance_requests.data');
});

test('tenant can list their own maintenance requests only', function () {
    $tenant = User::factory()->create();
    $apartment = Apartment::factory()->create();
    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    MaintenanceRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
    ]);

    MaintenanceRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => User::factory()->create()->id,
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->getJson('/api/maintenance-requests');

    $response->assertStatus(200)->assertJsonCount(1, 'data.maintenance_requests.data');
});

test('manager can update maintenance request status and tenant cannot', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $request = MaintenanceRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'open',
    ]);

    Sanctum::actingAs($manager);
    $managerResponse = $this->putJson("/api/maintenance-requests/{$request->id}", [
        'status' => 'in_progress',
    ]);
    $managerResponse->assertStatus(200)
        ->assertJsonPath('data.maintenance_request.status', 'in_progress');

    Sanctum::actingAs($tenant);
    $tenantResponse = $this->putJson("/api/maintenance-requests/{$request->id}", [
        'status' => 'resolved',
    ]);
    $tenantResponse->assertStatus(403);
});
