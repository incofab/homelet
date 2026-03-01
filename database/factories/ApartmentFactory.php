<?php

namespace Database\Factories;

use App\Models\Apartment;
use App\Models\Building;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApartmentFactory extends Factory
{
    protected $model = Apartment::class;

    public function definition(): array
    {
        return [
            'building_id' => Building::factory(),
            'unit_code' => strtoupper($this->faker->bothify('A##')),
            'type' => $this->faker->randomElement([
                'one_room',
                'self_contain',
                'one_bedroom',
                'two_bedroom',
                'three_bedroom',
                'custom',
            ]),
            'yearly_price' => $this->faker->numberBetween(500_000, 5_000_000),
            'description' => $this->faker->optional()->sentence,
            'floor' => $this->faker->optional()->randomElement(['Ground', '1', '2', '3']),
            'status' => $this->faker->randomElement(['vacant', 'occupied', 'maintenance']),
            'is_public' => $this->faker->boolean(30),
            'amenities' => $this->faker->optional()->randomElements([
                'parking',
                'water',
                'generator',
                'wifi',
            ], $this->faker->numberBetween(1, 3)),
        ];
    }
}
