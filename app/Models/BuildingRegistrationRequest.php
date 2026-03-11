<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BuildingRegistrationRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'building_id',
        'approved_by',
        'rejected_by',
        'status',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'owner_name',
        'owner_email',
        'owner_phone',
        'owner_password',
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

    protected $hidden = [
        'owner_password',
    ];

    protected $casts = [
        'for_sale' => 'boolean',
        'sale_price' => TrimDecimal::class,
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
