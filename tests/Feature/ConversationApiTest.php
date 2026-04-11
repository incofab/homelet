<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\Lease;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can create conversation for apartment with tenant participant', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($admin);
    $response = $this->postJson('/api/conversations', [
        'apartment_id' => $apartment->id,
        'participant_ids' => [$tenant->id],
    ]);

    $response->assertStatus(201);

    $conversation = Conversation::first();
    expect($conversation)->not->toBeNull();
    expect($conversation->participants()->count())->toBe(2);
});

test('tenant cannot create conversation outside their leased apartment', function () {
    $tenant = User::factory()->create();

    $building = Building::factory()->create();
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Sanctum::actingAs($tenant);
    $response = $this->postJson('/api/conversations', [
        'apartment_id' => $apartment->id,
        'participant_ids' => [$tenant->id],
    ]);

    $response->assertStatus(403);
});

test('tenant can create conversation for leased apartment without specifying participants', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->postJson('/api/conversations', [
        'apartment_id' => $apartment->id,
    ]);

    $response->assertCreated();

    $conversation = Conversation::first();

    expect($conversation)->not->toBeNull();
    expect($conversation->participants()->where('users.id', $tenant->id)->exists())->toBeTrue();
    expect($conversation->participants()->where('users.id', $owner->id)->exists())->toBeTrue();
});

test('tenant to tenant conversation is blocked', function () {
    $tenantA = User::factory()->create();
    $tenantB = User::factory()->create();

    $building = Building::factory()->create();
    $apartmentA = Apartment::factory()->create(['building_id' => $building->id]);
    $apartmentB = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartmentA->id,
        'tenant_id' => $tenantA->id,
        'status' => 'active',
    ]);

    Lease::factory()->create([
        'apartment_id' => $apartmentB->id,
        'tenant_id' => $tenantB->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenantA);
    $response = $this->postJson('/api/conversations', [
        'building_id' => $building->id,
        'participant_ids' => [$tenantB->id],
    ]);

    $response->assertStatus(422);
});

test('manager cannot create conversation for unrelated building', function () {
    $manager = User::factory()->create();
    $building = Building::factory()->create();

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);

    $tenant = User::factory()->create();

    Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson('/api/conversations', [
        'apartment_id' => $otherApartment->id,
        'participant_ids' => [$tenant->id],
    ]);

    $response->assertStatus(403);
});

test('participants can list conversations and send messages', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $conversation = Conversation::factory()->create([
        'building_id' => $building->id,
        'apartment_id' => $apartment->id,
        'created_by' => $admin->id,
    ]);

    $conversation->participants()->sync([$admin->id, $tenant->id]);

    Sanctum::actingAs($tenant);
    $listResponse = $this->getJson('/api/conversations');
    $listResponse
        ->assertStatus(200)
        ->assertJsonCount(1, 'data.conversations.data')
        ->assertJsonPath('data.conversations.data.0.title', $admin->name)
        ->assertJsonPath('data.conversations.data.0.counterpart.name', $admin->name);

    $messageResponse = $this->postJson("/api/conversations/{$conversation->id}/messages", [
        'body' => 'Hello there',
    ]);
    $messageResponse
        ->assertStatus(201)
        ->assertJsonPath('data.message.sender.name', $tenant->name)
        ->assertJsonPath('data.message.is_mine', true);

    expect(Message::where('conversation_id', $conversation->id)->count())->toBe(1);
});

test('messages endpoint returns sender details and ownership', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $conversation = Conversation::factory()->create([
        'building_id' => $building->id,
        'apartment_id' => $apartment->id,
        'created_by' => $owner->id,
    ]);

    $conversation->participants()->sync([$owner->id, $tenant->id]);

    Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $owner->id,
        'body' => 'Welcome to the building',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->getJson("/api/conversations/{$conversation->id}/messages");

    $response
        ->assertOk()
        ->assertJsonPath('data.messages.data.0.sender.name', $owner->name)
        ->assertJsonPath('data.messages.data.0.is_mine', false)
        ->assertJsonPath('data.messages.data.0.body', 'Welcome to the building');
});
