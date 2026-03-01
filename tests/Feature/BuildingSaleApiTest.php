<?php

use App\Models\Building;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('owner can mark building for sale with price', function () {
    $owner = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    Sanctum::actingAs($owner);

    $response = $this->putJson("/api/buildings/{$building->id}", [
        'for_sale' => true,
        'sale_price' => 120000000,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('data.building.for_sale', true)
        ->assertJsonPath('data.building.sale_price', 120000000);
});

test('public can view buildings for sale', function () {
    $forSale = Building::factory()->create([
        'for_sale' => true,
        'sale_price' => 50000000,
    ]);

    $notForSale = Building::factory()->create([
        'for_sale' => false,
        'sale_price' => null,
    ]);

    $response = $this->getJson('/api/public/buildings-for-sale');

    $response->assertStatus(200);
    $response->assertJsonCount(1, 'data.buildings.data');
    $response->assertJsonPath('data.buildings.data.0.id', $forSale->id);
});

test('sale price is required when for_sale is true', function () {
    $owner = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    Sanctum::actingAs($owner);

    $response = $this->putJson("/api/buildings/{$building->id}", [
        'for_sale' => true,
    ]);

    $response->assertStatus(422)->assertJsonPath('success', false);
});
