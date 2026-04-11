<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'building_id' => Building::factory(),
            'expense_category_id' => null,
            'recorded_by' => User::factory(),
            'title' => $this->faker->randomElement([
                'Generator fuel',
                'Plumbing repair',
                'Security service',
                'Cleaning supplies',
            ]),
            'vendor_name' => $this->faker->optional()->company(),
            'amount' => $this->faker->numberBetween(20_000, 300_000),
            'expense_date' => $this->faker->date(),
            'payment_method' => $this->faker->optional()->randomElement([
                'cash',
                'bank_transfer',
                'card',
                'cheque',
                'other',
            ]),
            'reference' => $this->faker->optional()->bothify('EXP-####'),
            'description' => $this->faker->optional()->sentence(),
            'notes' => $this->faker->optional()->paragraph(),
        ];
    }

    public function categorized(): self
    {
        return $this->state(function (array $attributes): array {
            return [
                'expense_category_id' => ExpenseCategory::factory()->state([
                    'building_id' => $attributes['building_id'] ?? Building::factory(),
                ]),
            ];
        });
    }
}
