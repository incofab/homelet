<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

test('assign admin command promotes an existing user', function () {
    $user = User::factory()->create([
        'email' => 'promote@example.com',
    ]);

    $exitCode = Artisan::call('users:assign-admin', [
        'email' => $user->email,
    ]);

    expect($exitCode)->toBe(0);
    expect($user->fresh()->hasRole(User::ROLE_ADMIN))->toBeTrue();
});
