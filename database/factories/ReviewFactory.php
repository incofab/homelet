<?php

namespace Database\Factories;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        $isBuilding = $this->faker->boolean();

        return [
            'user_id' => User::factory(),
            'reviewable_type' => $isBuilding ? Building::class : Apartment::class,
            'reviewable_id' => $isBuilding ? Building::factory() : Apartment::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'comment' => $this->faker->sentence,
            'verified' => $this->faker->boolean(30),
        ];
    }
}
