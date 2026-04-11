<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use App\Contracts\SendsSms;
use App\Jobs\SendTenancyAgreementEmail;
use App\Mail\RentalRequestRejectedMail;

uses(RefreshDatabase::class);

test('public can create rental request', function () {
    $apartment = Apartment::factory()->create();

    $response = $this->postJson('/api/public/rental-requests', [
        'apartment_id' => $apartment->id,
        'name' => 'Prospective Tenant',
        'email' => 'lead@example.com',
        'phone' => '1234567890',
        'message' => 'Interested in the unit.',
    ]);

    $response->assertStatus(201);

    $request = RentalRequest::where('email', 'lead@example.com')->first();
    expect($request)->not->toBeNull();
    expect($request->status)->toBe('new');
});

test('public can create rental request via request-interest alias', function () {
    $apartment = Apartment::factory()->create();

    $response = $this->postJson('/api/public/request-interest', [
        'apartment_id' => $apartment->id,
        'name' => 'Prospective Tenant',
        'email' => 'alias@example.com',
        'phone' => '1234567890',
        'message' => 'Interested in the unit.',
    ]);

    $response->assertStatus(201);

    $request = RentalRequest::where('email', 'alias@example.com')->first();
    expect($request)->not->toBeNull();
    expect($request->status)->toBe('new');
});

test('admin can list rental requests scoped to building', function () {
    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    RentalRequest::factory()->create(['apartment_id' => $apartment->id]);

    $otherBuilding = Building::factory()->create();
    $otherApartment = Apartment::factory()->create(['building_id' => $otherBuilding->id]);
    RentalRequest::factory()->create(['apartment_id' => $otherApartment->id]);

    Sanctum::actingAs($admin);
    $response = $this->getJson('/api/rental-requests');

    $response->assertStatus(200)->assertJsonCount(2, 'data.rental_requests.data');
});

test('manager can update rental request status and tenant cannot', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $tenant = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $rentalRequest = RentalRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'status' => 'new',
    ]);

    Sanctum::actingAs($manager);
    $managerResponse = $this->putJson("/api/rental-requests/{$rentalRequest->id}", [
        'status' => 'contacted',
    ]);
    $managerResponse->assertStatus(200)->assertJsonPath('data.rental_request.status', 'contacted');

    Sanctum::actingAs($tenant);
    $tenantResponse = $this->putJson("/api/rental-requests/{$rentalRequest->id}", [
        'status' => 'contacted',
    ]);
    $tenantResponse->assertStatus(403);
});

test('manager can approve a rental request and create tenant lease and optional payment', function () {
    Queue::fake();

    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
        'yearly_price' => 1_500_000,
    ]);
    $rentalRequest = RentalRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'name' => 'Prospective Tenant',
        'email' => 'prospect@example.com',
        'phone' => '08012345678',
        'status' => RentalRequest::STATUS_CONTACTED,
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/rental-requests/{$rentalRequest->id}/approve", [
        'start_date' => '2026-04-01',
        'record_payment' => true,
        'payment_amount' => 500_000,
        'payment_date' => '2026-04-01',
        'payment_due_date' => '2026-04-05',
        'payment_status' => 'paid',
        'payment_reference' => 'RR-001',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.rental_request.status', RentalRequest::STATUS_APPROVED)
        ->assertJsonPath('data.tenant.email', 'prospect@example.com')
        ->assertJsonPath('data.lease.apartment_id', $apartment->id)
        ->assertJsonPath('data.payment.amount', 500000);

    $tenant = User::query()->where('email', 'prospect@example.com')->first();
    $lease = Lease::query()->where('apartment_id', $apartment->id)->first();
    $payment = Payment::query()->where('lease_id', $lease?->id)->first();

    expect($tenant)->not->toBeNull()
        ->and($tenant->role)->toBe('tenant')
        ->and($lease)->not->toBeNull()
        ->and($lease->tenant_id)->toBe($tenant->id)
        ->and($payment)->not->toBeNull()
        ->and($payment->transaction_reference)->toBe('RR-001')
        ->and($apartment->refresh()->status)->toBe('occupied')
        ->and($rentalRequest->refresh()->tenant_id)->toBe($tenant->id)
        ->and($rentalRequest->lease_id)->toBe($lease->id);

    Queue::assertPushed(SendTenancyAgreementEmail::class);
});

test('manager can select an apartment when approving a rental request', function () {
    Queue::fake();

    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $requestedApartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'occupied',
    ]);
    $assignedApartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
        'yearly_price' => 1_200_000,
    ]);
    $rentalRequest = RentalRequest::factory()->create([
        'apartment_id' => $requestedApartment->id,
        'name' => 'Prospective Tenant',
        'email' => 'selected-apartment@example.com',
        'phone' => '08012345678',
        'status' => RentalRequest::STATUS_NEW,
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/rental-requests/{$rentalRequest->id}/approve", [
        'apartment_id' => $assignedApartment->id,
        'start_date' => '2026-04-01',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.rental_request.apartment_id', $assignedApartment->id)
        ->assertJsonPath('data.lease.apartment_id', $assignedApartment->id);

    expect($rentalRequest->refresh()->apartment_id)->toBe($assignedApartment->id)
        ->and($assignedApartment->refresh()->status)->toBe('occupied');
});

test('approving a rental request reuses an existing tenant account when contact details match', function () {
    Queue::fake();

    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $existingTenant = User::factory()->create([
        'name' => 'Existing Tenant',
        'email' => 'tenant@example.com',
        'phone' => '08012345678',
    ]);
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create([
        'building_id' => $building->id,
        'status' => 'vacant',
    ]);
    $rentalRequest = RentalRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'name' => 'Existing Tenant',
        'email' => 'tenant@example.com',
        'phone' => '08012345678',
        'status' => RentalRequest::STATUS_NEW,
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/rental-requests/{$rentalRequest->id}/approve", [
        'start_date' => '2026-04-01',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.tenant.id', $existingTenant->id);

    expect(User::query()->where('email', 'tenant@example.com')->count())->toBe(1);
});

test('manager can reject a rental request and send email and sms notifications', function () {
    Mail::fake();

    $smsFake = new class implements SendsSms
    {
        public array $messages = [];

        public function send(string $phoneNumber, string $message): void
        {
            $this->messages[] = compact('phoneNumber', 'message');
        }
    };
    app()->instance(SendsSms::class, $smsFake);

    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $rentalRequest = RentalRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'name' => 'Prospective Tenant',
        'email' => 'lead@example.com',
        'phone' => '08012345678',
        'status' => RentalRequest::STATUS_NEW,
    ]);

    Sanctum::actingAs($manager);
    $response = $this->postJson("/api/rental-requests/{$rentalRequest->id}/reject", [
        'rejection_reason' => 'The apartment is no longer available.',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.rental_request.status', RentalRequest::STATUS_REJECTED)
        ->assertJsonPath('data.rental_request.rejection_reason', 'The apartment is no longer available.');

    Mail::assertSent(RentalRequestRejectedMail::class, function ($mail) {
        return $mail->hasTo('lead@example.com');
    });

    expect($smsFake->messages)->toHaveCount(1)
        ->and($smsFake->messages[0]['phoneNumber'])->toBe('08012345678')
        ->and($smsFake->messages[0]['message'])->toContain('not approved');
});

test('rental request approval and rejection reject already processed requests', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    $apartment = Apartment::factory()->create(['building_id' => $building->id]);
    $approvedRequest = RentalRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'status' => RentalRequest::STATUS_APPROVED,
    ]);

    Sanctum::actingAs($manager);

    $this->postJson("/api/rental-requests/{$approvedRequest->id}/approve", [
        'start_date' => '2026-04-01',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['rental_request']);

    $this->postJson("/api/rental-requests/{$approvedRequest->id}/reject", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['rental_request']);
});
