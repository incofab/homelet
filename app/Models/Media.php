<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'model_type',
        'model_id',
        'collection',
        'disk',
        'path',
        'url',
        'mime_type',
        'size',
        'is_video',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'is_video' => 'boolean',
        'metadata' => 'array',
    ];

    public function model()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
