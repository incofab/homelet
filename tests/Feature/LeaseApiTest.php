<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('landlord can extend an active lease by new end date', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id, 'status' => 'occupied']);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'status' => 'active',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->putJson("/api/leases/{$lease->id}/extend", [
        'new_end_date' => '2027-06-30',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.lease.id', $lease->id);

    expect(substr((string) $response->json('data.lease.end_date'), 0, 10))->toBe('2027-06-30');

    expect($lease->refresh()->end_date->toDateString())->toBe('2027-06-30');
});

test('manager can extend an active lease by duration in months', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id, 'status' => 'occupied']);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'status' => 'active',
    ]);

    Sanctum::actingAs($manager);

    $response = $this->putJson("/api/leases/{$lease->id}/extend", [
        'duration_in_months' => 6,
    ]);

    $response->assertOk();

    expect(substr((string) $response->json('data.lease.end_date'), 0, 10))->toBe('2027-06-30');
});

test('tenant cannot extend a lease', function () {
    $tenant = User::factory()->create();
    $lease = Lease::factory()->create([
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->putJson("/api/leases/{$lease->id}/extend", [
        'duration_in_months' => 6,
    ]);

    $response->assertForbidden();
});

test('extend lease validates the new end date is after the current end date', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id, 'status' => 'occupied']);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'end_date' => '2026-12-31',
        'status' => 'active',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->putJson("/api/leases/{$lease->id}/extend", [
        'new_end_date' => '2026-12-31',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['new_end_date']);
});

test('landlord can renew an active lease and create a new lease record', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'occupied',
        'is_public' => true,
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 1_200_000,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'status' => 'active',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson("/api/leases/{$lease->id}/renew", [
        'duration_in_months' => 12,
        'new_rent_amount' => 1_350_000,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.previous_lease.status', 'renewed')
        ->assertJsonPath('data.lease.apartment_id', $apartment->id)
        ->assertJsonPath('data.lease.tenant_id', $tenant->id)
        ->assertJsonPath('data.lease.rent_amount', 1350000);

    expect(substr((string) $response->json('data.lease.start_date'), 0, 10))->toBe('2027-01-01');
    expect(substr((string) $response->json('data.lease.end_date'), 0, 10))->toBe('2028-01-01');

    $newLease = Lease::query()
        ->where('apartment_id', $apartment->id)
        ->where('status', 'active')
        ->whereKeyNot($lease->id)
        ->first();

    expect($newLease)->not->toBeNull()
        ->and($lease->refresh()->status)->toBe('renewed')
        ->and($apartment->refresh()->status)->toBe('occupied')
        ->and($apartment->refresh()->is_public)->toBeFalse();
});

test('landlord can renew an expired lease and record first payment', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
        'is_public' => true,
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 900_000,
        'start_date' => '2025-01-01',
        'end_date' => '2025-12-31',
        'status' => 'expired',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson("/api/leases/{$lease->id}/renew", [
        'start_date' => '2026-01-15',
        'end_date' => '2026-12-31',
        'record_payment' => true,
        'payment_amount' => 450_000,
        'payment_date' => '2026-01-15',
        'payment_due_date' => '2026-01-20',
        'payment_reference' => 'RENEW-001',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.previous_lease.status', 'expired')
        ->assertJsonPath('data.payment.amount', 450000)
        ->assertJsonPath('data.payment.transaction_reference', 'RENEW-001')
        ->assertJsonPath('data.payment.due_date', '2026-01-20');

    expect(substr((string) $response->json('data.lease.start_date'), 0, 10))->toBe('2026-01-15');

    expect(Payment::query()->count())->toBe(1)
        ->and($apartment->refresh()->status)->toBe('occupied');
});

test('renew lease validates the renewal start date is after the current lease end date', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'end_date' => '2026-12-31',
        'status' => 'active',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson("/api/leases/{$lease->id}/renew", [
        'start_date' => '2026-12-31',
        'duration_in_months' => 12,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['start_date']);
});

test('renew lease rejects leases that are not active or expired', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'renewed',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson("/api/leases/{$lease->id}/renew", [
        'duration_in_months' => 12,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['lease']);
});

test('renew lease rejects a lease that is not the most recent for the same building', function () {
    $owner = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $firstApartment = Apartment::factory()->create(['building_id' => $building->id]);
    $secondApartment = Apartment::factory()->create(['building_id' => $building->id]);

    $olderLease = Lease::factory()->create([
        'apartment_id' => $firstApartment->id,
        'tenant_id' => $tenant->id,
        'start_date' => '2025-01-01',
        'end_date' => '2025-12-31',
        'status' => 'expired',
    ]);

    Lease::factory()->create([
        'apartment_id' => $secondApartment->id,
        'tenant_id' => $tenant->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'status' => 'active',
    ]);

    Sanctum::actingAs($owner);

    $response = $this->postJson("/api/leases/{$olderLease->id}/renew", [
        'duration_in_months' => 12,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['lease'])
        ->assertJsonPath('errors.lease.0', 'Only the most recent lease for this building can be renewed.');
});

test('tenant cannot renew a lease', function () {
    $tenant = User::factory()->create();
    $lease = Lease::factory()->create([
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    Sanctum::actingAs($tenant);

    $response = $this->postJson("/api/leases/{$lease->id}/renew", [
        'duration_in_months' => 12,
    ]);

    $response->assertForbidden();
});
