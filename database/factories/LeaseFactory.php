<?php

namespace Database\Factories;

use App\Models\Apartment;
use App\Models\Lease;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeaseFactory extends Factory
{
    protected $model = Lease::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-2 months', '+1 month');
        $endDate = (clone $startDate)->modify('+12 months');

        return [
            'apartment_id' => Apartment::factory(),
            'tenant_id' => User::factory(),
            'rent_amount' => $this->faker->numberBetween(50_000, 500_000),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'status' => 'active',
        ];
    }
}
