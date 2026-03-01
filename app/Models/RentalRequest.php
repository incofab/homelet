<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'apartment_id',
        'name',
        'email',
        'phone',
        'message',
        'status',
    ];

    public function apartment()
    {
        return $this->belongsTo(Apartment::class);
    }
}
