<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lease extends Model
{
    use HasFactory;

    protected $fillable = [
        'apartment_id',
        'tenant_id',
        'rent_amount',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'apartment_id' => 'integer',
        'tenant_id' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'rent_amount' => TrimDecimal::class,
    ];

    public function apartment()
    {
        return $this->belongsTo(Apartment::class);
    }

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
