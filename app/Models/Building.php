<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use HasFactory;

    public const ROLE_LANDLORD = 'landlord';

    public const ROLE_MANAGER = 'manager';

    public const ROLE_CARETAKER = 'caretaker';

    protected $fillable = [
        'owner_id',
        'name',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'country',
        'description',
        'for_sale',
        'sale_price',
    ];

    protected $casts = [
        'for_sale' => 'boolean',
        'sale_price' => TrimDecimal::class,
    ];

    protected static function booted(): void
    {
        static::created(function (Building $building): void {
            if (! $building->owner_id) {
                return;
            }

            $building->assignUserRole($building->owner, self::ROLE_LANDLORD);
        });
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'building_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function apartments()
    {
        return $this->hasMany(Apartment::class);
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'model');
    }

    public function reviews()
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function assignUserRole(User $user, string $role): void
    {
        $existing = $this->users()->where('users.id', $user->id)->exists();

        if ($existing) {
            $this->users()->updateExistingPivot($user->id, ['role' => $role]);

            return;
        }

        $this->users()->attach($user->id, ['role' => $role]);
    }
}
