<?php

namespace Database\Factories;

use App\Models\Apartment;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'building_id' => null,
            'apartment_id' => Apartment::factory(),
            'created_by' => User::factory(),
        ];
    }
}
