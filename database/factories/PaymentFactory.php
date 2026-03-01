<?php

namespace Database\Factories;

use App\Models\Lease;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $paymentDate = $this->faker->dateTimeBetween('-1 month', 'now');

        return [
            'lease_id' => Lease::factory(),
            'tenant_id' => User::factory(),
            'amount' => $this->faker->numberBetween(50_000, 500_000),
            'payment_method' => $this->faker->randomElement(['manual', 'online']),
            'transaction_reference' => $this->faker->optional()->uuid,
            'payment_date' => $paymentDate->format('Y-m-d'),
            'status' => $this->faker->randomElement(['pending', 'paid', 'failed']),
            'metadata' => $this->faker->optional()->passthrough([
                'channel' => $this->faker->randomElement(['bank', 'card', 'transfer']),
                'processor' => $this->faker->randomElement(['paystack', 'flutterwave']),
            ]),
        ];
    }
}
