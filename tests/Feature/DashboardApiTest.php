<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin dashboard returns scoped counts and sums', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-01'));

    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $vacantApartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
    ]);

    $occupiedApartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'occupied',
    ]);

    $tenant = User::factory()->create();
    $lease = Lease::factory()->create([
        'apartment_id' => $occupiedApartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(30)->toDateString(),
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'status' => 'paid',
        'amount' => 100_000,
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'status' => 'pending',
        'amount' => 50_000,
        'metadata' => [
            'due_date' => Carbon::today()->subDay()->toDateString(),
        ],
    ]);

    MaintenanceRequest::factory()->create([
        'apartment_id' => $occupiedApartment->id,
        'tenant_id' => $tenant->id,
    ]);

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create([
        'building_id' => $otherBuilding->id,
        'status' => 'occupied',
    ]);

    $otherLease = Lease::factory()->create([
        'apartment_id' => $otherApartment->id,
        'tenant_id' => User::factory()->create()->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(30)->toDateString(),
    ]);

    Payment::factory()->create([
        'lease_id' => $otherLease->id,
        'tenant_id' => $otherLease->tenant_id,
        'status' => 'paid',
        'amount' => 500_000,
    ]);

    Sanctum::actingAs($admin);
    $response = $this->getJson('/api/dashboard/admin');

    $response->assertStatus(200)
        ->assertJsonPath('data.counts.buildings', 2)
        ->assertJsonPath('data.counts.apartments', 3)
        ->assertJsonPath('data.counts.vacant', 1)
        ->assertJsonPath('data.counts.occupied', 2)
        ->assertJsonPath('data.counts.tenants', 2)
        ->assertJsonPath('data.expiring_leases_next_90_days', 2)
        ->assertJsonPath('data.total_income_paid', 600000)
        ->assertJsonPath('data.pending_payments', 1)
        ->assertJsonPath('data.overdue_payments', 1)
        ->assertJsonPath('data.maintenance_requests', 1);
});

test('tenant dashboard returns lease details and payment summary', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-01'));

    $tenant = User::factory()->create();

    $apartment = Apartment::factory()->create([
        'status' => 'occupied',
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(45)->toDateString(),
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'status' => 'paid',
        'payment_date' => Carbon::today()->subDays(2)->toDateString(),
    ]);

    Payment::factory()->create([
        'lease_id' => $lease->id,
        'tenant_id' => $tenant->id,
        'status' => 'pending',
        'payment_date' => Carbon::today()->subDay()->toDateString(),
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->getJson('/api/dashboard/tenant');

    $response->assertStatus(200)
        ->assertJsonPath('data.active_lease.id', $lease->id)
        ->assertJsonPath('data.days_to_expiry', 45)
        ->assertJsonPath('data.payment_summary.paid', 1)
        ->assertJsonPath('data.payment_summary.pending', 1)
        ->assertJsonPath('data.payment_summary.failed', 0);
});

test('tenant dashboard alias route returns metrics', function () {
    $tenant = User::factory()->create();

    $apartment = Apartment::factory()->create([
        'status' => 'occupied',
    ]);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(10)->toDateString(),
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->getJson('/api/tenant/dashboard');

    $response->assertStatus(200)
        ->assertJsonPath('data.active_lease.id', $lease->id);
});

test('non tenant cannot access tenant dashboard', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);
    $response = $this->getJson('/api/dashboard/tenant');

    $response->assertStatus(403);
});
