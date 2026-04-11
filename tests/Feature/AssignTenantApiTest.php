<?php

use App\Mail\TenancyAgreementMail;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
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
        'tenant_phone' => '(555) 000-1111',
        'tenant_name' => 'Test Tenant',
        'start_date' => '2026-03-01',
    ];

    Sanctum::actingAs($admin);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", $payload);

    $response->assertStatus(201);

    $tenant = User::where('phone', '5550001111')->first();

    expect($tenant)->not->toBeNull();
    expect($tenant->role)->toBe(User::DASHBOARD_TENANT);
    expect($tenant->email)->toBe('tenant@example.com');

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

test('admin can assign tenant and record payment immediately', function () {
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

    Sanctum::actingAs($admin);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", [
        'tenant_email' => 'tenant@example.com',
        'tenant_phone' => '08012345678',
        'tenant_name' => 'Test Tenant',
        'start_date' => '2026-03-01',
        'rent_amount' => 1_200_000,
        'record_payment' => true,
        'payment_amount' => 600_000,
        'payment_date' => '2026-03-01',
        'payment_due_date' => '2026-03-05',
        'payment_status' => 'paid',
        'payment_reference' => 'PAY-001',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.payment.amount', 600000)
        ->assertJsonPath('data.payment.status', 'paid')
        ->assertJsonPath('data.payment.method', 'manual')
        ->assertJsonPath('data.payment.transaction_reference', 'PAY-001')
        ->assertJsonPath('data.payment.due_date', '2026-03-05');

    $payment = Payment::query()->first();

    expect($payment)->not->toBeNull();
    expect($payment->amount)->toBe(600000);
    expect($payment->payment_method)->toBe('manual');
    expect($payment->transaction_reference)->toBe('PAY-001');
    expect(data_get($payment->metadata, 'due_date'))->toBe('2026-03-05');
});

test('manager can look up an existing tenant before assignment', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create([
        'name' => 'Existing Tenant',
        'email' => 'tenant@example.com',
        'phone' => '5550001111',
    ]);

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant/lookup", [
        'tenant_email' => 'tenant@example.com',
        'tenant_phone' => '(555) 000-1111',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.exists', true)
        ->assertJsonPath('data.requires_name', false)
        ->assertJsonPath('data.tenant.id', $tenant->id)
        ->assertJsonPath('data.tenant.name', 'Existing Tenant');
});

test('tenant lookup fails when phone and email belong to different users', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
    ]);

    User::factory()->create([
        'email' => 'first@example.com',
        'phone' => '5550001111',
    ]);
    User::factory()->create([
        'email' => 'second@example.com',
        'phone' => '5550002222',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant/lookup", [
        'tenant_email' => 'first@example.com',
        'tenant_phone' => '5550002222',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['tenant_email', 'tenant_phone']);
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
        'tenant_phone' => '5552223333',
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
        'tenant_phone' => '5559990000',
        'start_date' => '2026-03-01',
    ]);

    $response->assertStatus(403);
});

test('assign tenant can match an existing user by phone without email', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $existingTenant = User::factory()->create([
        'email' => null,
        'phone' => '5557778888',
    ]);

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", [
        'tenant_phone' => '555-777-8888',
        'start_date' => '2026-03-01',
    ]);

    $response->assertStatus(201);

    expect(Lease::where('tenant_id', $existingTenant->id)->exists())->toBeTrue();
    expect(User::where('phone', '5557778888')->count())->toBe(1);
});

test('assign tenant requires a name when creating a new tenant', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/apartments/{$apartment->id}/assign-tenant", [
        'tenant_phone' => '5553334444',
        'start_date' => '2026-03-01',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['tenant_name']);
});
