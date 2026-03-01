<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use HasFactory;

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
    ];

    protected static function booted(): void
    {
        static::created(function (Building $building): void {
            if (! $building->owner_id) {
                return;
            }

            $building->users()->syncWithoutDetaching([
                $building->owner_id => ['role_in_building' => 'admin'],
            ]);
        });
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'building_users')
            ->withPivot('role_in_building')
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
}
