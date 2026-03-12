<?php

use App\Mail\TenancyAgreementMail;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can assign tenant and create lease', function () {
    Mail::fake();

    $owner = User::factory()->create();
    $admin = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignPlatformAdmin($admin);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'yearly_price' => 1_200_000,
        'status' => 'vacant',
    ]);

    $payload = [
        'tenant_email' => 'tenant@example.com',
        'tenant_name' => 'Test Tenant',
        'start_date' => '2026-03-01',
    ];

    Sanctum::actingAs($admin);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", $payload);

    $response->assertStatus(201);

    $tenant = User::where('email', 'tenant@example.com')->first();

    expect($tenant)->not->toBeNull();
    expect($tenant->role)->toBe(User::ROLE_USER);

    $lease = Lease::where('apartment_id', $apartment->id)->first();

    expect($lease)->not->toBeNull();
    expect($lease->tenant_id)->toBe($tenant->id);
    expect($lease->rent_amount)->toBe(1_200_000);
    expect($lease->status)->toBe('active');
    expect($lease->end_date->toDateString())->toBe(Carbon::parse('2026-03-01')->addYear()->toDateString());

    expect($apartment->refresh()->status)->toBe('occupied');
    expect($apartment->tenants()->where('users.id', $tenant->id)->exists())->toBeTrue();

    Mail::assertSent(TenancyAgreementMail::class, function ($mail) use ($tenant) {
        return $mail->hasTo($tenant->email);
    });
});

test('assigning tenant fails when active lease exists', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'occupied',
    ]);

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", [
        'tenant_email' => 'newtenant@example.com',
        'start_date' => '2026-03-01',
        'rent_amount' => 150_000,
    ]);

    $response->assertStatus(422);
    expect(Lease::where('apartment_id', $apartment->id)->count())->toBe(1);
});

test('tenant cannot assign tenant to apartment', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", [
        'tenant_email' => 'blocked@example.com',
        'start_date' => '2026-03-01',
    ]);

    $response->assertStatus(403);
});
