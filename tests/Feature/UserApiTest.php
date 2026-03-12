<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('platform admin can list users', function () {
    $admin = assignPlatformAdmin(User::factory()->create());
    $userA = User::factory()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
    ]);
    $userB = User::factory()->create([
        'name' => 'John Smith',
        'email' => 'john@example.com',
    ]);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/users');

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data.users.data')
        ->assertJsonPath('data.users.data.0.id', $userB->id);
});

test('platform admin can search users', function () {
    $admin = assignPlatformAdmin(User::factory()->create());
    User::factory()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
    ]);
    User::factory()->create([
        'name' => 'John Smith',
        'email' => 'john@example.com',
    ]);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/users?q=jane');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data.users.data')
        ->assertJsonPath('data.users.data.0.email', 'jane@example.com');
});

test('non admin cannot list users', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->getJson('/api/users');

    $response->assertStatus(403);
});

test('platform admin can impersonate a non admin user', function () {
    $admin = assignPlatformAdmin(User::factory()->create());
    $user = User::factory()->create([
        'name' => 'Jane Doe',
    ]);

    Sanctum::actingAs($admin);

    $response = $this->postJson("/api/users/{$user->id}/impersonate");

    $response->assertOk()
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.dashboard', 'home')
        ->assertJsonPath('data.impersonation.impersonator.id', $admin->id)
        ->assertJsonPath('data.impersonation.impersonated_user.id', $user->id)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['user', 'dashboard', 'dashboard_context', 'token', 'impersonation'],
            'errors',
        ]);

    $this->assertDatabaseCount('personal_access_tokens', 1);
});

test('platform admin cannot impersonate another admin', function () {
    $admin = assignPlatformAdmin(User::factory()->create());
    $otherAdmin = assignPlatformAdmin(User::factory()->create());

    Sanctum::actingAs($admin);

    $response = $this->postJson("/api/users/{$otherAdmin->id}/impersonate");

    $response->assertStatus(422)
        ->assertJsonPath('errors.user.0', 'Impersonation is only allowed for other non-admin users.');
});

test('non admin cannot impersonate users', function () {
    $actor = User::factory()->create();
    $user = User::factory()->create();

    Sanctum::actingAs($actor);

    $response = $this->postJson("/api/users/{$user->id}/impersonate");

    $response->assertStatus(403);
});
