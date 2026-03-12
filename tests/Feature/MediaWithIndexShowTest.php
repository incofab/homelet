<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\MaintenanceRequest;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('building index and show include media', function () {
    $owner = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    Media::factory()->create([
        'model_type' => Building::class,
        'model_id' => $building->id,
        'collection' => 'images',
        'created_by' => $owner->id,
    ]);

    Sanctum::actingAs($owner);

    $index = $this->getJson('/api/buildings');
    $index->assertStatus(200)->assertJsonStructure([
        'data' => [
            'buildings' => [
                'data' => [
                    [
                        'media',
                    ],
                ],
            ],
        ],
    ]);

    $show = $this->getJson("/api/buildings/{$building->id}");
    $show->assertStatus(200)->assertJsonStructure([
        'data' => [
            'building' => ['media'],
        ],
    ]);
});

test('apartment index and show include media', function () {
    $owner = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Media::factory()->create([
        'model_type' => Apartment::class,
        'model_id' => $apartment->id,
        'collection' => 'images',
        'created_by' => $owner->id,
    ]);

    Sanctum::actingAs($owner);

    $index = $this->getJson("/api/buildings/{$building->id}/apartments");
    $index->assertStatus(200)->assertJsonStructure([
        'data' => [
            'apartments' => [
                'data' => [
                    [
                        'media',
                    ],
                ],
            ],
        ],
    ]);

    $show = $this->getJson("/api/apartments/{$apartment->id}");
    $show->assertStatus(200)->assertJsonStructure([
        'data' => [
            'apartment' => ['media'],
        ],
    ]);
});

test('maintenance request index includes media for tenant', function () {
    $tenant = User::factory()->create();
    $apartment = Apartment::factory()->create();
    \App\Models\Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);
    $request = MaintenanceRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
    ]);

    Media::factory()->create([
        'model_type' => MaintenanceRequest::class,
        'model_id' => $request->id,
        'collection' => 'images',
        'created_by' => $tenant->id,
    ]);

    Sanctum::actingAs($tenant);

    $index = $this->getJson('/api/maintenance-requests');
    $index->assertStatus(200)->assertJsonStructure([
        'data' => [
            'maintenance_requests' => [
                'data' => [
                    [
                        'media',
                    ],
                ],
            ],
        ],
    ]);
});
