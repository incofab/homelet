<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'name',
        'color',
        'description',
    ];

    protected $casts = [
        'building_id' => 'integer',
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
