<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        return [
            'model_type' => User::class,
            'model_id' => User::factory(),
            'collection' => $this->faker->randomElement(['images', 'videos', 'profile']),
            'disk' => 'public',
            'path' => 'media/users/1/images/example.jpg',
            'url' => 'http://localhost/storage/media/users/1/images/example.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 12345,
            'is_video' => false,
            'metadata' => ['original_name' => 'example.jpg'],
            'created_by' => User::factory(),
        ];
    }
}
