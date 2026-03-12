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
