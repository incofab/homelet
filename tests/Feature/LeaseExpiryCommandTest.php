<?php

use App\Mail\QuitNoticeMail;
use App\Models\Apartment;
use App\Models\Lease;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('expire command marks lease expired and vacates apartment when no other active lease', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-10'));
    config(['queue.default' => 'sync']);
    Mail::fake();

    $tenant = User::factory()->create(['email' => 'tenant@example.com']);
    $apartment = Apartment::factory()->create(['status' => 'occupied']);

    $lease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::yesterday()->toDateString(),
    ]);

    Artisan::call('leases:expire');

    expect($lease->refresh()->status)->toBe('expired');
    expect($apartment->refresh()->status)->toBe('vacant');
    expect($apartment->refresh()->is_public)->toBeTrue();

    Mail::assertSent(QuitNoticeMail::class, function ($mail) use ($tenant) {
        return $mail->hasTo($tenant->email);
    });
});

test('expire command keeps apartment occupied when another active lease exists', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-10'));
    config(['queue.default' => 'sync']);
    Mail::fake();

    $tenant = User::factory()->create(['email' => 'tenant@example.com']);
    $otherTenant = User::factory()->create(['email' => 'other-tenant@example.com']);
    $apartment = Apartment::factory()->create(['status' => 'occupied']);

    $expiredLease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::yesterday()->toDateString(),
    ]);

    $activeLease = Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $otherTenant->id,
        'status' => 'active',
        'end_date' => Carbon::tomorrow()->toDateString(),
    ]);

    Artisan::call('leases:expire');

    expect($expiredLease->refresh()->status)->toBe('expired');
    expect($activeLease->refresh()->status)->toBe('active');
    expect($apartment->refresh()->status)->toBe('occupied');

    Mail::assertNothingSent();
});
