<?php

use App\Models\Building;
use App\Models\BuildingRegistrationRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function tokenForUser(User $user): string
{
    return $user->createToken('test')->plainTextToken;
}

test('authenticated user can submit request and admin can approve', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $adminRole = Role::create(['name' => 'admin']);
    $admin->roles()->attach($adminRole);

    $payload = [
        'name' => 'Main Plaza',
        'address_line1' => '123 Main St',
        'address_line2' => null,
        'city' => 'Austin',
        'state' => 'TX',
        'country' => 'USA',
        'description' => 'Primary building',
    ];

    $createResponse = $this->withToken(tokenForUser($owner))
        ->postJson('/api/building-registration-requests', $payload);

    $createResponse->assertStatus(201)
        ->assertJsonPath('data.request.status', 'pending');

    $requestId = $createResponse->json('data.request.id');

    $approveResponse = $this->withToken(tokenForUser($admin))
        ->postJson("/api/admin/building-registration-requests/{$requestId}/approve");

    $approveResponse->assertStatus(200)
        ->assertJsonPath('data.request.status', 'approved');

    $this->assertDatabaseHas('building_registration_requests', [
        'id' => $requestId,
        'status' => BuildingRegistrationRequest::STATUS_APPROVED,
        'user_id' => $owner->id,
    ]);

    $this->assertDatabaseHas('buildings', [
        'owner_id' => $owner->id,
        'name' => 'Main Plaza',
    ]);
});

test('public request creates user and building on approval', function () {
    $admin = User::factory()->create();
    $adminRole = Role::create(['name' => 'admin']);
    $admin->roles()->attach($adminRole);

    $payload = [
        'name' => 'Skyline Towers',
        'address_line1' => '55 Broad St',
        'address_line2' => null,
        'city' => 'Lagos',
        'state' => 'Lagos',
        'country' => 'NG',
        'description' => 'Luxury building',
        'owner_name' => 'Public Owner',
        'owner_email' => 'public.owner@example.com',
        'owner_phone' => '1234567890',
        'owner_password' => 'secret123',
        'owner_password_confirmation' => 'secret123',
    ];

    $createResponse = $this->postJson('/api/public/building-registration-requests', $payload);

    $createResponse->assertStatus(201)
        ->assertJsonPath('data.request.status', 'pending');

    $requestId = $createResponse->json('data.request.id');

    $approveResponse = $this->withToken(tokenForUser($admin))
        ->postJson("/api/admin/building-registration-requests/{$requestId}/approve");

    $approveResponse->assertStatus(200)
        ->assertJsonPath('data.request.status', 'approved');

    $owner = User::where('email', 'public.owner@example.com')->first();

    expect($owner)->not->toBeNull();

    $this->assertDatabaseHas('buildings', [
        'owner_id' => $owner->id,
        'name' => 'Skyline Towers',
    ]);
});

test('non admin cannot approve registration request', function () {
    $owner = User::factory()->create();
    $actor = User::factory()->create();

    $request = BuildingRegistrationRequest::factory()->create([
        'user_id' => $owner->id,
        'owner_name' => $owner->name,
        'owner_email' => $owner->email,
        'owner_phone' => $owner->phone,
    ]);

    $response = $this->withToken(tokenForUser($actor))
        ->postJson("/api/admin/building-registration-requests/{$request->id}/approve");

    $response->assertStatus(403);
});
