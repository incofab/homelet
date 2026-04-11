<?php

namespace App\Models;

use App\Casts\TrimDecimal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'expense_category_id',
        'recorded_by',
        'title',
        'vendor_name',
        'amount',
        'expense_date',
        'payment_method',
        'reference',
        'description',
        'notes',
    ];

    protected $casts = [
        'amount' => TrimDecimal::class,
        'expense_date' => 'date',
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
