<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

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

        if ($this->isLandlordOwnedBy($user)) {
            return true;
        }

        return $this->isRecordedBy($user) && $this->isLatestForBuilding();
    }

    public function canBeDeletedBy(User $user): bool
    {
        return $this->canBeUpdatedBy($user) && $this->isWithinDeleteWindow();
    }

    public function updateRestrictionReasonFor(User $user): ?string
    {
        if ($this->canBeUpdatedBy($user)) {
            return null;
        }

        if (! $this->isLandlordOwnedBy($user) && ! $this->isRecordedBy($user)) {
            return 'Only the landlord or the person who recorded this expense can edit it.';
        }

        return 'Only the latest recorded expense can be edited by its creator.';
    }

    public function deleteRestrictionReasonFor(User $user): ?string
    {
        if (! $this->canBeUpdatedBy($user)) {
            if (! $this->isLandlordOwnedBy($user) && ! $this->isRecordedBy($user)) {
                return 'Only the landlord or the person who recorded this expense can delete it.';
            }

            return 'Only the latest recorded expense can be deleted by its creator.';
        }

        if (! $this->isWithinDeleteWindow()) {
            return 'Expenses can only be deleted within 2 hours of creation.';
        }

        return null;
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

    public function isWithinDeleteWindow(): bool
    {
        return $this->created_at instanceof Carbon
            ? $this->created_at->greaterThanOrEqualTo(now()->subHours(2))
            : false;
    }

    private function isLandlordOwnedBy(User $user): bool
    {
        return $this->building?->owner_id === $user->id;
    }

    private function isRecordedBy(User $user): bool
    {
        return $this->recorded_by === $user->id;
    }
}
