<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $appends = [
        'method',
        'due_date',
        'apartment',
    ];

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
        'lease_id' => 'integer',
        'tenant_id' => 'integer',
        'payment_date' => 'date',
        'metadata' => 'array',
        'amount' => TrimDecimal::class,
    ];

    public function lease()
    {
        return $this->belongsTo(Lease::class);
    }

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function getMethodAttribute(): ?string
    {
        return $this->payment_method;
    }

    public function getDueDateAttribute(): ?string
    {
        return data_get($this->metadata, 'due_date')
            ?? optional($this->payment_date)->toDateString();
    }

    public function getApartmentAttribute(): ?array
    {
        $apartment = $this->lease?->apartment;

        if (! $apartment) {
            return null;
        }

        return [
            'id' => $apartment->id,
            'unit_code' => $apartment->unit_code,
        ];
    }
}
