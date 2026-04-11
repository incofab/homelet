<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RbacSeeder::class);

        $user = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@email.com',
            'phone' => '2348000000000',
            'password' => Hash::make('password'),
        ]);
        $user->assignRole(Role::findOrCreate(User::ROLE_ADMIN));
    }
}
