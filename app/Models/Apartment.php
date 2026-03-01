<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Apartment extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'unit_code',
        'type',
        'yearly_price',
        'description',
        'floor',
        'status',
        'is_public',
        'amenities',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'amenities' => 'array',
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function tenants()
    {
        return $this->belongsToMany(User::class, 'apartment_users')
            ->withTimestamps();
    }

    public function leases()
    {
        return $this->hasMany(Lease::class);
    }

    public function rentalRequests()
    {
        return $this->hasMany(RentalRequest::class);
    }

    public function maintenanceRequests()
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'model');
    }
}
