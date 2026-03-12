<?php

use App\Models\Apartment;
use App\Models\Lease;
use App\Models\User;
use App\Services\LeaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

test('service prevents multiple active leases for the same apartment', function () {
    $apartment = Apartment::factory()->create();
    $tenant = User::factory()->create();
    $otherTenant = User::factory()->create();

    $service = new LeaseService;

    $service->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 150_000,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addYear()->toDateString(),
        'status' => 'active',
    ]);

    expect(fn () => $service->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $otherTenant->id,
        'rent_amount' => 175_000,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addYear()->toDateString(),
        'status' => 'active',
    ]))->toThrow(ValidationException::class);
});

test('service allows new active lease when existing lease is not active', function () {
    $apartment = Apartment::factory()->create();
    $tenant = User::factory()->create();

    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'status' => 'expired',
    ]);

    $service = new LeaseService;

    $lease = $service->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 200_000,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addYear()->toDateString(),
        'status' => 'active',
    ]);

    expect($lease->status)->toBe('active');
});
