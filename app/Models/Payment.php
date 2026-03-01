<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'lease_id',
        'tenant_id',
        'amount',
        'payment_method',
        'transaction_reference',
        'payment_date',
        'status',
        'metadata',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'metadata' => 'array',
    ];

    public function lease()
    {
        return $this->belongsTo(Lease::class);
    }

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }
}
