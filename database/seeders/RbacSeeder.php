<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'admin',
            'manager',
            'tenant',
        ];

        $permissions = [
            'building.view',
            'building.create',
            'building.update',
            'building.delete',
            'apartment.view',
            'apartment.create',
            'apartment.update',
            'apartment.delete',
            'tenant.assign',
            'lease.view',
            'lease.create',
            'lease.update',
            'lease.delete',
            'payment.view',
            'payment.record',
            'chat.view',
            'chat.send',
        ];

        $roleModels = collect($roles)->mapWithKeys(function (string $name) {
            return [$name => Role::firstOrCreate(['name' => $name])];
        });

        $permissionModels = collect($permissions)->mapWithKeys(function (string $name) {
            return [$name => Permission::firstOrCreate(['name' => $name])];
        });

        $roleModels['admin']->permissions()->sync(
            $permissionModels->values()->pluck('id')->all()
        );

        $managerPermissions = [
            'building.view',
            'building.create',
            'building.update',
            'apartment.view',
            'apartment.create',
            'apartment.update',
            'tenant.assign',
            'lease.view',
            'lease.create',
            'lease.update',
            'payment.view',
            'payment.record',
            'chat.view',
            'chat.send',
        ];

        $tenantPermissions = [
            'building.view',
            'apartment.view',
            'lease.view',
            'payment.view',
            'chat.view',
            'chat.send',
        ];

        $roleModels['manager']->permissions()->sync(
            $permissionModels->only($managerPermissions)->values()->pluck('id')->all()
        );

        $roleModels['tenant']->permissions()->sync(
            $permissionModels->only($tenantPermissions)->values()->pluck('id')->all()
        );
    }
}
