<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::findOrCreate('user');
        Role::findOrCreate('admin');

        Permission::findOrCreate('building.assign-landlord');
        Permission::findOrCreate('building.assign-staff');
    }
}
