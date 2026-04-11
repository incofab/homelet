<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\RentalRequest;
use App\Models\Review;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

test('demo seed command creates connected data', function () {
    Artisan::call('demo:seed', [
        '--buildings' => 1,
        '--apartments' => 3,
        '--managers' => 1,
        '--tenants' => 2,
        '--payments' => 1,
        '--maintenance' => 1,
        '--conversations' => 1,
        '--messages' => 2,
        '--rental-requests' => 1,
        '--building-reviews' => 1,
        '--apartment-reviews' => 1,
    ]);

    expect(Building::count())->toBe(1);
    expect(Apartment::count())->toBe(3);
    expect(Lease::count())->toBe(2);
    expect(Payment::count())->toBe(2);
    expect(MaintenanceRequest::count())->toBe(2);
    expect(RentalRequest::count())->toBe(1);
    expect(Conversation::count())->toBe(1);
    expect(Review::count())->toBe(2);

    $lease = Lease::first();
    $apartment = $lease->apartment;

    expect($apartment->status)->toBe('occupied');
    expect($apartment->tenants()->where('users.id', $lease->tenant_id)->exists())->toBeTrue();
    expect($lease->tenant->role)->toBe('tenant');

    $building = Building::first();
    expect($building->users()
        ->where('users.id', $building->owner_id)
        ->wherePivot('role', Building::ROLE_LANDLORD)
        ->exists())->toBeTrue();

    $maintenanceRequest = MaintenanceRequest::first();
    expect(Lease::query()
        ->where('tenant_id', $maintenanceRequest->tenant_id)
        ->where('apartment_id', $maintenanceRequest->apartment_id)
        ->where('status', 'active')
        ->exists())->toBeTrue();

    $conversation = Conversation::first();
    $participants = $conversation->participants()->get();

    expect($participants)->toHaveCount(2);
    expect($participants->contains(fn ($user) => $user->leases()->where('status', 'active')->exists()))->toBeTrue();
    expect($participants->contains(fn ($user) => $user->buildings()->wherePivot('role', Building::ROLE_MANAGER)->exists() || $user->ownedBuildingIds()->isNotEmpty()))->toBeTrue();

    $rentalRequest = RentalRequest::first();
    $rentalApartment = $rentalRequest->apartment;
    expect($rentalApartment->status)->toBe('vacant');
    expect($rentalApartment->is_public)->toBeTrue();
});
