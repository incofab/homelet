<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\ExpenseCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseCategoryFactory extends Factory
{
    protected $model = ExpenseCategory::class;

    public function definition(): array
    {
        return [
            'building_id' => Building::factory(),
            'name' => $this->faker->unique()->randomElement([
                'Utilities',
                'Repairs',
                'Security',
                'Cleaning',
                'Legal',
            ]),
            'color' => $this->faker->optional()->hexColor(),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
