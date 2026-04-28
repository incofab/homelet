<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class Building extends Model
{
    use HasFactory;

    public const ROLE_LANDLORD = 'landlord';

    public const ROLE_MANAGER = 'manager';

    public const ROLE_CARETAKER = 'caretaker';

    protected $fillable = [
        'owner_id',
        'address_id',
        'name',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'latitude',
        'longitude',
        'formatted_address',
        'description',
        'contact_email',
        'contact_phone',
        'for_sale',
        'sale_price',
    ];

    protected $casts = [
        'for_sale' => 'boolean',
        'sale_price' => TrimDecimal::class,
    ];

    protected $with = [
        'address',
    ];

    protected $appends = [
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'managers',
    ];

    protected static function booted(): void
    {
        static::saving(function (Building $building): void {
            $building->resolveAddressFromVirtualAttributes();
        });

        static::created(function (Building $building): void {
            if (! $building->owner_id) {
                return;
            }

            $building->assignUserRole($building->owner, self::ROLE_LANDLORD);
        });
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
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

    public function expenseCategories()
    {
        return $this->hasMany(ExpenseCategory::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'model')
            ->orderBy('id');
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

    public function getManagersAttribute()
    {
        if (! $this->relationLoaded('users')) {
            return [];
        }

        return $this->users
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->id === $this->owner_id
                    ? self::ROLE_LANDLORD
                    : $user->pivot?->role,
            ])
            ->values();
    }

    public function getAddressLine1Attribute(): ?string
    {
        return $this->address?->address_line1;
    }

    public function getAddressLine2Attribute(): ?string
    {
        return $this->address?->address_line2;
    }

    public function getCityAttribute(): ?string
    {
        return $this->address?->city;
    }

    public function getStateAttribute(): ?string
    {
        return $this->address?->state;
    }

    public function getPostalCodeAttribute(): ?string
    {
        return $this->address?->postal_code;
    }

    public function getCountryAttribute(): ?string
    {
        return $this->address?->country;
    }

    private function resolveAddressFromVirtualAttributes(): void
    {
        $addressPayload = Arr::only($this->attributes, [
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
            'latitude',
            'longitude',
            'formatted_address',
        ]);

        if ($addressPayload !== []) {
            $existingAddress = $this->address_id
                ? Address::query()->find($this->address_id)
                : null;

            $address = Address::findOrCreateFromPayload([
                'address_line1' => $existingAddress?->address_line1,
                'address_line2' => $existingAddress?->address_line2,
                'city' => $existingAddress?->city,
                'state' => $existingAddress?->state,
                'postal_code' => $existingAddress?->postal_code,
                'country' => $existingAddress?->country,
                'latitude' => $existingAddress?->latitude,
                'longitude' => $existingAddress?->longitude,
                'formatted_address' => $existingAddress?->formatted_address,
                ...$addressPayload,
            ]);
            $this->attributes['address_id'] = $address->id;
        }

        foreach (array_keys($addressPayload) as $key) {
            unset($this->attributes[$key]);
        }
    }
}
