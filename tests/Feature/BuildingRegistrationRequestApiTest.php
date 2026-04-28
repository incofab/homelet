<?php

use App\Models\BuildingRegistrationRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function tokenForUser(User $user): string
{
    return $user->createToken('test')->plainTextToken;
}

test('authenticated user can submit request and admin can approve', function () {
    Mail::fake();
    config()->set('homelet.platform_admin_contacts', [
        'email' => 'approvals@homelet.test',
        'phone' => '+234 700 000 0000',
        'whatsapp' => '+234 701 000 0000',
        'support_hours' => 'Weekdays, 9 AM - 5 PM WAT',
    ]);

    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());

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
        ->assertJsonPath('data.request.status', 'pending')
        ->assertJsonPath('data.admin_contacts.email', 'approvals@homelet.test')
        ->assertJsonPath('data.admin_contacts.phone', '+234 700 000 0000')
        ->assertJsonPath('data.admin_contacts.whatsapp', '+234 701 000 0000')
        ->assertJsonPath('data.admin_contacts.support_hours', 'Weekdays, 9 AM - 5 PM WAT');

    $requestId = $createResponse->json('data.request.id');

    Sanctum::actingAs($admin);
    $approveResponse = $this->postJson("/api/admin/building-registration-requests/{$requestId}/approve");

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

test('guest cannot submit a building registration request', function () {
    $payload = [
        'name' => 'Skyline Towers',
        'address_line1' => '55 Broad St',
        'city' => 'Lagos',
        'state' => 'Lagos',
        'country' => 'NG',
        'description' => 'Luxury building',
    ];

    $response = $this->postJson('/api/building-registration-requests', $payload);

    $response->assertStatus(401);
});

test('authenticated user can list their own registration requests by status', function () {
    $owner = User::factory()->create();
    $otherOwner = User::factory()->create();

    $pendingRequest = BuildingRegistrationRequest::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Owner Pending Tower',
        'status' => BuildingRegistrationRequest::STATUS_PENDING,
    ]);
    BuildingRegistrationRequest::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Owner Approved Tower',
        'status' => BuildingRegistrationRequest::STATUS_APPROVED,
    ]);
    BuildingRegistrationRequest::factory()->create([
        'user_id' => $otherOwner->id,
        'name' => 'Other Pending Tower',
        'status' => BuildingRegistrationRequest::STATUS_PENDING,
    ]);

    $response = $this->withToken(tokenForUser($owner))
        ->getJson('/api/building-registration-requests?status=pending');

    $response->assertOk()
        ->assertJsonPath('data.requests.data.0.id', $pendingRequest->id)
        ->assertJsonPath('data.requests.data.0.name', 'Owner Pending Tower')
        ->assertJsonMissingPath('data.requests.data.1');
});

test('authenticated user can view their own registration request only', function () {
    $owner = User::factory()->create();
    $otherOwner = User::factory()->create();

    $request = BuildingRegistrationRequest::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Owner Request',
    ]);
    $otherRequest = BuildingRegistrationRequest::factory()->create([
        'user_id' => $otherOwner->id,
        'name' => 'Other Request',
    ]);

    $this->withToken(tokenForUser($owner))
        ->getJson("/api/building-registration-requests/{$request->id}")
        ->assertOk()
        ->assertJsonPath('data.request.id', $request->id)
        ->assertJsonPath('data.request.name', 'Owner Request');

    $this->withToken(tokenForUser($owner))
        ->getJson("/api/building-registration-requests/{$otherRequest->id}")
        ->assertForbidden();
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
