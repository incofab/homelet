<?php

use App\Models\Apartment;
use App\Models\Building;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public can list buildings with public apartments and contact details', function () {
    $visibleBuilding = Building::factory()->create([
        'contact_email' => 'leasing@harbor.test',
        'contact_phone' => '555-0101',
    ]);

    Apartment::factory()->create([
        'building_id' => $visibleBuilding->id,
        'is_public' => true,
        'status' => 'vacant',
    ]);

    $hiddenBuilding = Building::factory()->create();

    Apartment::factory()->create([
        'building_id' => $hiddenBuilding->id,
        'is_public' => false,
    ]);

    $response = $this->getJson('/api/public/buildings');

    $response
        ->assertStatus(200)
        ->assertJsonCount(1, 'data.buildings.data')
        ->assertJsonPath('data.buildings.data.0.id', $visibleBuilding->id)
        ->assertJsonPath('data.buildings.data.0.contact_email', 'leasing@harbor.test')
        ->assertJsonPath('data.buildings.data.0.contact_phone', '555-0101');
});

test('public can view a building with its public apartments', function () {
    $building = Building::factory()->create([
        'contact_email' => 'info@sunrise.test',
        'contact_phone' => '555-3434',
    ]);

    $publicApartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'unit_code' => 'A1',
        'is_public' => true,
        'status' => 'vacant',
    ]);

    Apartment::factory()->create([
        'building_id' => $building->id,
        'unit_code' => 'B2',
        'is_public' => false,
    ]);

    $response = $this->getJson("/api/public/buildings/{$building->id}");

    $response
        ->assertStatus(200)
        ->assertJsonPath('data.building.id', $building->id)
        ->assertJsonPath('data.building.contact_email', 'info@sunrise.test')
        ->assertJsonPath('data.building.contact_phone', '555-3434')
        ->assertJsonCount(1, 'data.building.apartments')
        ->assertJsonPath('data.building.apartments.0.id', $publicApartment->id);
});

test('public apartment detail includes building contact details', function () {
    $building = Building::factory()->create([
        'contact_email' => 'leasing@example.test',
        'contact_phone' => '555-0909',
    ]);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'is_public' => true,
        'status' => 'vacant',
    ]);

    $response = $this->getJson("/api/public/apartments/{$apartment->id}");

    $response
        ->assertStatus(200)
        ->assertJsonPath('data.apartment.id', $apartment->id)
        ->assertJsonPath('data.apartment.building.contact_email', 'leasing@example.test')
        ->assertJsonPath('data.apartment.building.contact_phone', '555-0909');
});
