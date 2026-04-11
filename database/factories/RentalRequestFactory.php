<?php

namespace Database\Factories;

use App\Models\Apartment;
use App\Models\RentalRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

class RentalRequestFactory extends Factory
{
    protected $model = RentalRequest::class;

    public function definition(): array
    {
        return [
            'apartment_id' => Apartment::factory(),
            'tenant_id' => null,
            'lease_id' => null,
            'name' => $this->faker->name,
            'email' => $this->faker->safeEmail,
            'phone' => $this->faker->optional()->phoneNumber,
            'message' => $this->faker->optional()->sentence,
            'status' => $this->faker->randomElement(['new', 'contacted', 'approved', 'rejected']),
            'approved_by' => null,
            'approved_at' => null,
            'rejected_by' => null,
            'rejected_at' => null,
            'rejection_reason' => null,
        ];
    }
}
