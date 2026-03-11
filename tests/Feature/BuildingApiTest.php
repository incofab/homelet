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
            ['name' => 'Updated Plaza']
        );

    $updateResponse
        ->assertStatus(200)
        ->assertJsonPath('data.building.name', 'Updated Plaza');

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

    $building->users()->attach($manager->id, ['role_in_building' => 'manager']);

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

test('only owner or admin can manage managers', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $manager = User::factory()->create();

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    $building->users()->attach($admin->id, ['role_in_building' => 'admin']);
    $building->users()->attach($manager->id, ['role_in_building' => 'manager']);

    expect($building->users()->wherePivot('user_id', $manager->id)->value('role_in_building'))
        ->toBe('manager');

    $payload = ['email' => 'newmanager@example.com', 'name' => 'New Manager'];

    $ownerResponse = $this->withToken(tokenFor($owner))
        ->postJson(
            "/api/buildings/{$building->id}/managers",
            $payload
        );
    $ownerResponse->assertStatus(201);

    $adminResponse = $this->withToken(tokenFor($admin))
        ->postJson(
            "/api/buildings/{$building->id}/managers",
            ['email' => 'adminadd@example.com']
        );
    $adminResponse->assertStatus(201);

    Sanctum::actingAs($manager);
    $managerResponse = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'blocked@example.com']
    );
    $managerResponse->assertStatus(403);

    Sanctum::actingAs($owner);
    $removeResponse = $this->deleteJson(
        "/api/buildings/{$building->id}/managers/{$manager->id}"
    );
    $removeResponse->assertStatus(200);
});
