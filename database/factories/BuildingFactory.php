<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuildingFactory extends Factory
{
    protected $model = Building::class;

    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'name' => $this->faker->company,
            'address_line1' => $this->faker->streetAddress,
            'address_line2' => $this->faker->optional()->secondaryAddress,
            'city' => $this->faker->city,
            'state' => $this->faker->state,
            'country' => $this->faker->country,
            'description' => $this->faker->optional()->sentence,
            'for_sale' => false,
            'sale_price' => null,
        ];
    }
}
