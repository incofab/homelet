<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('register creates a user and returns a token', function () {
    $payload = [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
    ];

    $response = $this->postJson('/api/auth/register', $payload);

    $response
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Registration successful.')
        ->assertJsonPath('data.user.email', 'jane@example.com')
        ->assertJsonPath('data.user.role', 'user')
        ->assertJsonPath('data.dashboard', 'admin')
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['user', 'dashboard', 'token'],
            'errors',
        ]);

    $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
    $this->assertDatabaseCount('personal_access_tokens', 1);
});

test('login returns a token for valid credentials', function () {
    $user = User::factory()->create([
        'password' => 'secret1234',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'secret1234',
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Login successful.')
        ->assertJsonPath('data.user.email', $user->email)
        ->assertJsonPath('data.user.role', 'user')
        ->assertJsonPath('data.dashboard', 'admin')
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['user', 'dashboard', 'token'],
            'errors',
        ]);

    $this->assertDatabaseCount('personal_access_tokens', 1);
});

test('me returns the authenticated user', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api');

    $response = $this->withToken($token->plainTextToken)->getJson('/api/auth/me');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.role', 'user')
        ->assertJsonPath('data.dashboard', 'admin');
});

test('logout deletes the current access token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api');

    $response = $this->withToken($token->plainTextToken)->postJson('/api/auth/logout');

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Logout successful.');

    $this->assertDatabaseCount('personal_access_tokens', 0);
});
