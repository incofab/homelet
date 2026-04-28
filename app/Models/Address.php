<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'latitude',
        'longitude',
        'formatted_address',
        'address_hash',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public static function findOrCreateFromPayload(array $payload): self
    {
        $attributes = self::normalizePayload($payload);
        $hash = self::hashFor($attributes);

        return self::firstOrCreate(
            ['address_hash' => $hash],
            [...$attributes, 'address_hash' => $hash]
        );
    }

    public static function normalizePayload(array $payload): array
    {
        $attributes = Arr::only($payload, [
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
            'latitude',
            'longitude',
            'formatted_address',
        ]);

        foreach ($attributes as $key => $value) {
            if (is_string($value)) {
                $attributes[$key] = trim($value);
            }
        }

        $attributes['address_line2'] = $attributes['address_line2'] ?? null;
        $attributes['postal_code'] = $attributes['postal_code'] ?? null;
        $attributes['latitude'] = $attributes['latitude'] ?? null;
        $attributes['longitude'] = $attributes['longitude'] ?? null;
        $attributes['formatted_address'] = $attributes['formatted_address'] ?? null;

        return $attributes;
    }

    public static function hashFor(array $attributes): string
    {
        $parts = collect([
            $attributes['address_line1'] ?? '',
            $attributes['address_line2'] ?? '',
            $attributes['city'] ?? '',
            $attributes['state'] ?? '',
            $attributes['postal_code'] ?? '',
            $attributes['country'] ?? '',
            $attributes['latitude'] ?? '',
            $attributes['longitude'] ?? '',
        ])->map(fn ($value) => Str::of((string) $value)->squish()->lower()->toString());

        return hash('sha256', $parts->implode('|'));
    }

    public function buildings()
    {
        return $this->hasMany(Building::class);
    }
}
