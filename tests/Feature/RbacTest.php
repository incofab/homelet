<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can be assigned a role and checked with hasRole', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('admin');

    $user->assignRole($role);

    expect($user->hasRole('admin'))->toBeTrue()
        ->and($user->hasRole('manager'))->toBeFalse();
});

test('user permissions resolve through roles', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('admin');
    $permission = Permission::findOrCreate('lease.view');
    $otherPermission = Permission::findOrCreate('lease.delete');

    $role->givePermissionTo($permission);
    $user->assignRole($role);

    expect($user->hasPermissionTo('lease.view'))->toBeTrue()
        ->and($user->hasPermissionTo('lease.delete'))->toBeFalse()
        ->and($user->hasAnyPermission(['lease.view', 'lease.delete']))->toBeTrue();
});
