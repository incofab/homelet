<?php

namespace Database\Factories;

use App\Models\BuildingRegistrationRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BuildingRegistrationRequest>
 */
class BuildingRegistrationRequestFactory extends Factory
{
    protected $model = BuildingRegistrationRequest::class;

    public function definition(): array
    {
        return [
            'status' => BuildingRegistrationRequest::STATUS_PENDING,
            'name' => $this->faker->company(),
            'address_line1' => $this->faker->streetAddress(),
            'address_line2' => $this->faker->optional()->secondaryAddress(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'postal_code' => $this->faker->optional()->postcode(),
            'country' => $this->faker->countryCode(),
            'latitude' => null,
            'longitude' => null,
            'formatted_address' => null,
            'description' => $this->faker->optional()->sentence(),
            'for_sale' => false,
            'sale_price' => null,
        ];
    }
}
