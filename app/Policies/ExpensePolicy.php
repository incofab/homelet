<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER])->isNotEmpty();
    }

    public function view(User $user, Expense $expense): bool
    {
        return $expense->building ? $user->canManageBuilding($expense->building) : false;
    }

    public function create(User $user, Building $building): bool
    {
        return $user->canManageBuilding($building);
    }
}
