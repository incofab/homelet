<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('public can create rental request', function () {
    $apartment = Apartment::factory()->create();

    $response = $this->postJson('/api/public/rental-requests', [
        'apartment_id' => $apartment->id,
        'name' => 'Prospective Tenant',
        'email' => 'lead@example.com',
        'phone' => '1234567890',
        'message' => 'Interested in the unit.',
    ]);

    $response->assertStatus(201);

    $request = RentalRequest::where('email', 'lead@example.com')->first();
    expect($request)->not->toBeNull();
    expect($request->status)->toBe('new');
});

test('admin can list rental requests scoped to building', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $building->users()->attach($admin->id, ['role_in_building' => 'admin']);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    RentalRequest::factory()->create(['apartment_id' => $apartment->id]);

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    RentalRequest::factory()->create(['apartment_id' => $otherApartment->id]);

    Sanctum::actingAs($admin);
    $response = $this->getJson('/api/rental-requests');

    $response->assertStatus(200)->assertJsonCount(1, 'data.rental_requests');
});

test('manager can update rental request status and tenant cannot', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $building->users()->attach($manager->id, ['role_in_building' => 'manager']);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $rentalRequest = RentalRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'status' => 'new',
    ]);

    Sanctum::actingAs($manager);
    $managerResponse = $this->putJson("/api/rental-requests/{$rentalRequest->id}", [
        'status' => 'contacted',
    ]);
    $managerResponse->assertStatus(200)->assertJsonPath('data.rental_request.status', 'contacted');

    Sanctum::actingAs($tenant);
    $tenantResponse = $this->putJson("/api/rental-requests/{$rentalRequest->id}", [
        'status' => 'closed',
    ]);
    $tenantResponse->assertStatus(403);
});
