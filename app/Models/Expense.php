<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'expense_category_id',
        'recorded_by',
        'title',
        'vendor_name',
        'amount',
        'expense_date',
        'payment_method',
        'reference',
        'description',
        'notes',
    ];

    protected $casts = [
        'building_id' => 'integer',
        'expense_category_id' => 'integer',
        'recorded_by' => 'integer',
        'amount' => TrimDecimal::class,
        'expense_date' => 'date',
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function canBeUpdatedBy(User $user): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        return $this->isLatestForBuilding() && $this->canBeManagedBy($user);
    }

    public function canBeDeletedBy(User $user): bool
    {
        return $this->canBeUpdatedBy($user);
    }

    public function updateRestrictionReasonFor(User $user): ?string
    {
        if ($this->canBeUpdatedBy($user)) {
            return null;
        }

        if (! $this->canBeManagedBy($user)) {
            return 'Only a building landlord, the building owner, a manager for the building, or the person who recorded this expense can edit it.';
        }

        return 'An expense can only be edited while it remains the latest recorded expense for the building.';
    }

    public function deleteRestrictionReasonFor(User $user): ?string
    {
        if ($this->canBeDeletedBy($user)) {
            return null;
        }

        if (! $this->canBeManagedBy($user)) {
            return 'Only a building landlord, the building owner, a manager for the building, or the person who recorded this expense can delete it.';
        }

        return 'An expense can only be deleted while it remains the latest recorded expense for the building.';
    }

    public function isLatestForBuilding(): bool
    {
        if (! $this->exists || ! $this->created_at) {
            return false;
        }

        return ! static::query()
            ->where('building_id', $this->building_id)
            ->where(function (Builder $query): void {
                $query->where('created_at', '>', $this->created_at)
                    ->orWhere(function (Builder $nested): void {
                        $nested->where('created_at', $this->created_at)
                            ->where('id', '>', $this->id);
                    });
            })
            ->exists();
    }

    private function isBuildingOwner(User $user): bool
    {
        return $this->building?->owner_id === $user->id;
    }

    private function isLandlord(User $user): bool
    {
        return $this->building ? $user->hasBuildingRole($this->building, Building::ROLE_LANDLORD) : false;
    }

    private function isManagedBy(User $user): bool
    {
        return $this->building ? $user->hasBuildingRole($this->building, Building::ROLE_MANAGER) : false;
    }

    private function isRecordedBy(User $user): bool
    {
        return $this->recorded_by === $user->id;
    }

    private function canBeManagedBy(User $user): bool
    {
        return $this->isBuildingOwner($user)
            || $this->isLandlord($user)
            || $this->isManagedBy($user)
            || $this->isRecordedBy($user);
    }
}
