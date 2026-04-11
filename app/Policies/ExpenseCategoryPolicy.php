<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\ExpenseCategory;
use App\Models\User;

class ExpenseCategoryPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isPlatformAdmin() ? true : null;
    }

    public function viewAny(User $user, Building $building): bool
    {
        return $user->canManageBuilding($building);
    }

    public function create(User $user, Building $building): bool
    {
        return $user->canManageBuilding($building);
    }

    public function update(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $expenseCategory->building ? $user->canManageBuilding($expenseCategory->building) : false;
    }

    public function delete(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $this->update($user, $expenseCategory);
    }
}
