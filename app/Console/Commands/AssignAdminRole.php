<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class AssignAdminRole extends Command
{
    protected $signature = 'users:assign-admin {email : Email address of the existing user}';

    protected $description = 'Assign the platform admin role to an existing user';

    public function handle(): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('User not found.');

            return self::FAILURE;
        }

        $user->assignRole(Role::findOrCreate(User::ROLE_ADMIN));

        $this->info(sprintf('Admin role assigned to %s.', $user->email));

        return self::SUCCESS;
    }
}
