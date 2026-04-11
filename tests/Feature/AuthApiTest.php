<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('register creates a user and returns a token', function () {
    $payload = [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone' => '(555) 123-4567',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
    ];

    $response = $this->postJson('/api/auth/register', $payload);

    $response
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Registration successful.')
        ->assertJsonPath('data.user.email', 'jane@example.com')
        ->assertJsonPath('data.user.phone', '5551234567')
        ->assertJsonPath('data.user.role', 'user')
        ->assertJsonPath('data.dashboard', 'home')
        ->assertJsonPath('data.dashboard_context.primary_dashboard', 'home')
        ->assertJsonPath('data.dashboard_context.is_building_user', false)
        ->assertJsonPath('data.dashboard_context.has_active_lease', false)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['user', 'dashboard', 'dashboard_context', 'token'],
            'errors',
        ]);

    $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'phone' => '5551234567']);
    $this->assertDatabaseCount('personal_access_tokens', 1);
});

test('register can create a user without email when phone is provided', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Phone User',
        'phone' => '+234 801 234 5678',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
    ]);

    $response
        ->assertStatus(201)
        ->assertJsonPath('data.user.email', null)
        ->assertJsonPath('data.user.phone', '2348012345678');
});

test('login returns a token for valid phone credentials', function () {
    $user = User::factory()->create([
        'email' => null,
        'phone' => '5551234567',
        'password' => 'secret1234',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'identifier' => '(555) 123-4567',
        'password' => 'secret1234',
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Login successful.')
        ->assertJsonPath('data.user.phone', $user->phone)
        ->assertJsonPath('data.user.role', 'user')
        ->assertJsonPath('data.dashboard', 'home')
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['user', 'dashboard', 'dashboard_context', 'token'],
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
        ->assertJsonPath('data.dashboard', 'home')
        ->assertJsonPath('data.dashboard_context.primary_dashboard', 'home');
});

test('login returns admin dashboard for platform admins', function () {
    $user = assignPlatformAdmin(User::factory()->create([
        'password' => 'secret1234',
    ]));

    $response = $this->postJson('/api/auth/login', [
        'identifier' => $user->email ?? $user->phone,
        'password' => 'secret1234',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.user.role', 'admin')
        ->assertJsonPath('data.dashboard', 'admin')
        ->assertJsonPath('data.dashboard_context.is_platform_admin', true)
        ->assertJsonPath('data.dashboard_context.is_building_user', false)
        ->assertJsonPath('data.dashboard_context.has_active_lease', false);
});

test('login returns admin dashboard for building users', function () {
    $user = User::factory()->create([
        'password' => 'secret1234',
    ]);

    Building::factory()->create([
        'owner_id' => $user->id,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'identifier' => $user->email ?? $user->phone,
        'password' => 'secret1234',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.user.role', 'landlord')
        ->assertJsonPath('data.dashboard', 'admin')
        ->assertJsonPath('data.dashboard_context.is_platform_admin', false)
        ->assertJsonPath('data.dashboard_context.is_building_user', true)
        ->assertJsonPath('data.dashboard_context.has_active_lease', false)
        ->assertJsonPath('data.dashboard_context.available_dashboards.0', 'admin');
});

test('login prefers admin dashboard when building user also has an active lease', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-12'));

    $user = User::factory()->create([
        'password' => 'secret1234',
    ]);

    Building::factory()->create([
        'owner_id' => $user->id,
    ]);

    $apartment = Apartment::factory()->create([
        'status' => 'occupied',
    ]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $user->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addMonth()->toDateString(),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'identifier' => $user->email ?? $user->phone,
        'password' => 'secret1234',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.user.role', 'landlord')
        ->assertJsonPath('data.dashboard', 'admin')
        ->assertJsonPath('data.dashboard_context.is_building_user', true)
        ->assertJsonPath('data.dashboard_context.has_active_lease', true)
        ->assertJsonPath('data.dashboard_context.available_dashboards.0', 'admin')
        ->assertJsonPath('data.dashboard_context.available_dashboards.1', 'tenant');
});

test('me returns tenant role for users with an active lease', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-12'));

    $user = User::factory()->create();
    $apartment = Apartment::factory()->create([
        'status' => 'occupied',
    ]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $user->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addMonth()->toDateString(),
    ]);

    $token = $user->createToken('api');

    $response = $this->withToken($token->plainTextToken)->getJson('/api/auth/me');

    $response
        ->assertOk()
        ->assertJsonPath('data.user.role', 'tenant')
        ->assertJsonPath('data.dashboard', 'tenant')
        ->assertJsonPath('data.dashboard_context.primary_dashboard', 'tenant');
});

test('me returns manager role for assigned building managers', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $token = $manager->createToken('api');

    $response = $this->withToken($token->plainTextToken)->getJson('/api/auth/me');

    $response
        ->assertOk()
        ->assertJsonPath('data.user.role', 'manager')
        ->assertJsonPath('data.dashboard', 'admin')
        ->assertJsonPath('data.dashboard_context.primary_dashboard', 'admin');
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
