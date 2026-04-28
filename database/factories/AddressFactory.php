<?php

namespace Database\Factories;

use App\Models\Address;
use Illuminate\Database\Eloquent\Factories\Factory;

class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        $payload = [
            'address_line1' => $this->faker->streetAddress,
            'address_line2' => $this->faker->optional()->secondaryAddress,
            'city' => $this->faker->city,
            'state' => $this->faker->state,
            'postal_code' => $this->faker->optional()->postcode,
            'country' => $this->faker->countryCode,
            'latitude' => null,
            'longitude' => null,
            'formatted_address' => null,
        ];

        return [
            ...$payload,
            'address_hash' => Address::hashFor($payload),
        ];
    }
}
