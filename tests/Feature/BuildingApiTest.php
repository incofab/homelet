<?php

use App\Models\Building;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function tokenFor(User $user): string
{
    return $user->createToken('test')->plainTextToken;
}

test('platform admin can create buildings directly', function () {
    $admin = assignPlatformAdmin(User::factory()->create());
    $owner = User::factory()->create();

    $payload = [
        'owner_id' => $owner->id,
        'name' => 'Main Plaza',
        'address_line1' => '123 Main St',
        'address_line2' => null,
        'city' => 'Austin',
        'state' => 'TX',
        'country' => 'USA',
        'description' => 'Primary building',
        'contact_email' => 'leasing@mainplaza.test',
        'contact_phone' => '555-1234',
    ];

    $createResponse = $this->withToken(tokenFor($admin))
        ->postJson('/api/buildings', $payload);

    $createResponse->assertStatus(201)
        ->assertJsonPath('data.building.name', 'Main Plaza')
        ->assertJsonPath('data.building.owner_id', $owner->id)
        ->assertJsonPath('data.building.contact_email', 'leasing@mainplaza.test')
        ->assertJsonPath('data.building.contact_phone', '555-1234');
});

test('owner cannot create buildings directly', function () {
    $owner = User::factory()->create();

    $payload = [
        'name' => 'Main Plaza',
        'address_line1' => '123 Main St',
        'address_line2' => null,
        'city' => 'Austin',
        'state' => 'TX',
        'country' => 'USA',
        'description' => 'Primary building',
    ];

    $createResponse = $this->withToken(tokenFor($owner))
        ->postJson('/api/buildings', $payload);

    $createResponse->assertStatus(403);
});

test('owner can update and delete owned building', function () {
    $owner = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $updateResponse = $this->withToken(tokenFor($owner))
        ->putJson(
            "/api/buildings/{$building->id}",
            [
                'name' => 'Updated Plaza',
                'contact_email' => 'hello@updatedplaza.test',
                'contact_phone' => '555-8888',
            ]
        );

    $updateResponse
        ->assertStatus(200)
        ->assertJsonPath('data.building.name', 'Updated Plaza')
        ->assertJsonPath('data.building.contact_email', 'hello@updatedplaza.test')
        ->assertJsonPath('data.building.contact_phone', '555-8888');

    $deleteResponse = $this->withToken(tokenFor($owner))
        ->deleteJson("/api/buildings/{$building->id}");

    $deleteResponse->assertStatus(200);
});

test('manager can view and update but cannot delete', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $showResponse = $this->withToken(tokenFor($manager))
        ->getJson("/api/buildings/{$building->id}");
    $showResponse->assertStatus(200);

    $updateResponse = $this->withToken(tokenFor($manager))
        ->putJson(
            "/api/buildings/{$building->id}",
            ['name' => 'Manager Update']
        );
    $updateResponse->assertStatus(200);

    $deleteResponse = $this->withToken(tokenFor($manager))
        ->deleteJson("/api/buildings/{$building->id}");
    $deleteResponse->assertStatus(403);
});

test('tenant cannot view update or delete building', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $showResponse = $this->withToken(tokenFor($tenant))
        ->getJson("/api/buildings/{$building->id}");
    $showResponse->assertStatus(403);

    $updateResponse = $this->withToken(tokenFor($tenant))
        ->putJson(
            "/api/buildings/{$building->id}",
            ['name' => 'Tenant Update']
        );
    $updateResponse->assertStatus(403);

    $deleteResponse = $this->withToken(tokenFor($tenant))
        ->deleteJson("/api/buildings/{$building->id}");
    $deleteResponse->assertStatus(403);
});

test('platform admin can assign landlords while landlords can assign managers and caretakers', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $manager = User::factory()->create();
    assignPlatformAdmin($admin);

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    expect($building->users()->where('users.id', $manager->id)->first()?->pivot->role)
        ->toBe(Building::ROLE_MANAGER);

    $ownerResponse = $this->withToken(tokenFor($owner))
        ->postJson(
            "/api/buildings/{$building->id}/managers",
            ['email' => 'newmanager@example.com', 'name' => 'New Manager', 'role' => Building::ROLE_MANAGER]
        );
    $ownerResponse->assertStatus(201);

    $caretakerResponse = $this->withToken(tokenFor($owner))
        ->postJson(
            "/api/buildings/{$building->id}/managers",
            ['email' => 'caretaker@example.com', 'name' => 'Caretaker', 'role' => Building::ROLE_CARETAKER]
        );
    $caretakerResponse->assertStatus(201);

    Sanctum::actingAs($admin);
    $adminResponse = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'landlord@example.com', 'role' => Building::ROLE_LANDLORD]
    );
    $adminResponse->assertStatus(201);

    Sanctum::actingAs($owner);
    $ownerCannotAssignLandlord = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'blocked-landlord@example.com', 'role' => Building::ROLE_LANDLORD]
    );
    $ownerCannotAssignLandlord->assertStatus(403);

    Sanctum::actingAs($manager);
    $managerResponse = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'blocked@example.com', 'role' => Building::ROLE_MANAGER]
    );
    $managerResponse->assertStatus(403);

    Sanctum::actingAs($owner);
    $removeResponse = $this->deleteJson(
        "/api/buildings/{$building->id}/managers/{$manager->id}"
    );
    $removeResponse->assertStatus(200);
});
