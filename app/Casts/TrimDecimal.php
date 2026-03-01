<?php
namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class TrimDecimal implements CastsAttributes
{
    public function get($model, $key, $value, $attributes)
    {
        return $value == (int)$value ? (int)$value : (float)$value;
    }

    public function set($model, $key, $value, $attributes)
    {
        return $value;
    }
}
