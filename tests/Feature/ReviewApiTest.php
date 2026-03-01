<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('authenticated user can create building review and is not verified without lease', function () {
    $user = User::factory()->create();
    $building = Building::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->postJson("/api/buildings/{$building->id}/reviews", [
        'rating' => 4,
        'comment' => 'Great place to live.',
    ]);

    $response
        ->assertStatus(201)
        ->assertJsonPath('data.review.rating', 4)
        ->assertJsonPath('data.review.verified', false);

    expect(Review::where('reviewable_type', Building::class)
        ->where('reviewable_id', $building->id)
        ->count())->toBe(1);
});

test('apartment review is verified for tenant with lease', function () {
    $tenant = User::factory()->create();
    $apartment = Apartment::factory()->create();

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->postJson("/api/apartments/{$apartment->id}/reviews", [
        'rating' => 5,
        'comment' => 'Verified tenant review.',
    ]);

    $response
        ->assertStatus(201)
        ->assertJsonPath('data.review.verified', true);
});

test('building review is verified for tenant with lease in building', function () {
    $tenant = User::factory()->create();
    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'expired',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->postJson("/api/buildings/{$building->id}/reviews", [
        'rating' => 3,
        'comment' => 'Past tenant review.',
    ]);

    $response
        ->assertStatus(201)
        ->assertJsonPath('data.review.verified', true);
});

test('guest cannot create reviews', function () {
    $building = Building::factory()->create();

    $response = $this->postJson("/api/buildings/{$building->id}/reviews", [
        'rating' => 4,
        'comment' => 'Should fail.',
    ]);

    $response->assertStatus(401);
});

test('can list building and apartment reviews', function () {
    $user = User::factory()->create();
    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create();

    Review::factory()->create([
        'user_id' => $user->id,
        'reviewable_type' => Building::class,
        'reviewable_id' => $building->id,
    ]);

    Review::factory()->create([
        'user_id' => $user->id,
        'reviewable_type' => Apartment::class,
        'reviewable_id' => $apartment->id,
    ]);

    Sanctum::actingAs($user);

    $buildingResponse = $this->getJson("/api/buildings/{$building->id}/reviews");
    $buildingResponse->assertStatus(200)->assertJsonCount(1, 'data.reviews.data');

    $apartmentResponse = $this->getJson("/api/apartments/{$apartment->id}/reviews");
    $apartmentResponse->assertStatus(200)->assertJsonCount(1, 'data.reviews.data');
});
