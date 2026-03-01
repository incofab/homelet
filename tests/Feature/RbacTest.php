<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can be assigned a role and checked with hasRole', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'manager']);

    $user->roles()->attach($role);

    expect($user->hasRole('manager'))->toBeTrue()
        ->and($user->hasRole('admin'))->toBeFalse();
});

test('user permissions resolve through roles', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'tenant']);
    $permission = Permission::create(['name' => 'lease.view']);
    $otherPermission = Permission::create(['name' => 'lease.delete']);

    $role->permissions()->attach($permission);
    $user->roles()->attach($role);

    expect($user->hasPermission('lease.view'))->toBeTrue()
        ->and($user->hasPermission('lease.delete'))->toBeFalse()
        ->and($user->hasPermission(['lease.view', 'lease.delete']))->toBeTrue();
});
