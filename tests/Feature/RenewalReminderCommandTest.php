<?php

use App\Mail\RenewalReminderMail;
use App\Models\Lease;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('renewal reminder email is sent exactly 90 days before end date', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-01'));
    config(['queue.default' => 'sync']);

    Mail::fake();

    $tenant = User::factory()->create(['email' => 'tenant@example.com']);

    Lease::factory()->create([
        'tenant_id' => $tenant->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(90)->toDateString(),
    ]);

    Lease::factory()->create([
        'tenant_id' => User::factory()->create(['email' => 'early-tenant@example.com'])->id,
        'status' => 'active',
        'end_date' => Carbon::today()->addDays(89)->toDateString(),
    ]);

    Artisan::call('leases:send-renewal-reminders');

    Mail::assertSent(RenewalReminderMail::class, function ($mail) use ($tenant) {
        return $mail->hasTo($tenant->email);
    });

    Mail::assertSent(RenewalReminderMail::class, 1);
});

test('no reminder is sent when lease is not active', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-01'));
    config(['queue.default' => 'sync']);

    Mail::fake();

    Lease::factory()->create([
        'tenant_id' => User::factory()->create(['email' => 'expired-tenant@example.com'])->id,
        'status' => 'expired',
        'end_date' => Carbon::today()->addDays(90)->toDateString(),
    ]);

    Artisan::call('leases:send-renewal-reminders');

    Mail::assertNothingSent();
});
