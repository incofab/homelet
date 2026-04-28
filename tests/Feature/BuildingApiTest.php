<?php

use App\Models\Address;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
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
        ->assertJsonPath('data.building.address.address_line1', '123 Main St')
        ->assertJsonPath('data.building.address_line1', '123 Main St')
        ->assertJsonPath('data.building.contact_email', 'leasing@mainplaza.test')
        ->assertJsonPath('data.building.contact_phone', '555-1234');

    $building = Building::query()->firstOrFail();

    expect($building->address_id)->not->toBeNull()
        ->and(Address::query()->count())->toBe(1);
});

test('building creation reuses matching addresses', function () {
    $admin = assignPlatformAdmin(User::factory()->create());

    $payload = [
        'name' => 'Main Plaza',
        'address_line1' => '123 Main St',
        'address_line2' => null,
        'city' => 'Austin',
        'state' => 'TX',
        'postal_code' => '78701',
        'country' => 'USA',
    ];

    $firstResponse = $this->withToken(tokenFor($admin))
        ->postJson('/api/buildings', $payload);

    $secondResponse = $this->withToken(tokenFor($admin))
        ->postJson('/api/buildings', [
            ...$payload,
            'name' => 'Main Plaza Annex',
        ]);

    $firstResponse->assertStatus(201);
    $secondResponse->assertStatus(201);

    expect(Address::query()->count())->toBe(1)
        ->and($firstResponse->json('data.building.address_id'))
        ->toBe($secondResponse->json('data.building.address_id'));
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

    $addressResponse = $this->withToken(tokenFor($owner))
        ->putJson(
            "/api/buildings/{$building->id}",
            [
                'address_line1' => '500 Updated Ave',
                'city' => 'Dallas',
                'state' => 'TX',
                'country' => 'USA',
            ]
        );

    $addressResponse
        ->assertStatus(200)
        ->assertJsonPath('data.building.address.address_line1', '500 Updated Ave')
        ->assertJsonPath('data.building.city', 'Dallas');

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

    $tenant = User::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $tenantResponse = $this->withToken(tokenFor($manager))
        ->getJson("/api/buildings/{$building->id}/tenants");
    $tenantResponse->assertStatus(200)
        ->assertJsonCount(1, 'data.tenants.data');

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

test('landlords can assign building roles and owner controls landlord removal', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $manager = User::factory()->create();
    $otherLandlord = User::factory()->create();
    assignPlatformAdmin($admin);

    $building = Building::factory()->create([
        'owner_id' => $owner->id,
    ]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    expect($building->users()->where('users.id', $manager->id)->first()?->pivot->role)
        ->toBe(Building::ROLE_MANAGER);

    Sanctum::actingAs($owner);
    $ownerResponse = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'newmanager@example.com', 'name' => 'New Manager', 'role' => Building::ROLE_MANAGER]
    );
    $ownerResponse->assertStatus(201);

    $caretakerResponse = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'caretaker@example.com', 'name' => 'Caretaker', 'role' => Building::ROLE_CARETAKER]
    );
    $caretakerResponse->assertStatus(201);

    $landlordResponse = $this->postJson(
        "/api/buildings/{$building->id}/managers",
        ['email' => 'landlord@example.com', 'role' => Building::ROLE_LANDLORD]
    );
    $landlordResponse->assertStatus(201);

    assignBuildingRole($building, $otherLandlord, Building::ROLE_LANDLORD);

    $showResponse = $this->getJson("/api/buildings/{$building->id}");
    $showResponse->assertOk()
        ->assertJsonPath('data.building.managers.0.role', Building::ROLE_LANDLORD);

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

    Sanctum::actingAs($otherLandlord);
    $otherLandlordCannotRemoveLandlord = $this->deleteJson(
        "/api/buildings/{$building->id}/managers/{$owner->id}"
    );
    $otherLandlordCannotRemoveLandlord->assertStatus(403);

    Sanctum::actingAs($owner);
    $ownerRemovesLandlord = $this->deleteJson(
        "/api/buildings/{$building->id}/managers/{$otherLandlord->id}"
    );
    $ownerRemovesLandlord->assertStatus(200);

    $ownerCannotRemoveSelf = $this->deleteJson(
        "/api/buildings/{$building->id}/managers/{$owner->id}"
    );
    $ownerCannotRemoveSelf->assertStatus(422);
});
