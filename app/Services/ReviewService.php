<?php

namespace App\Services;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Review;
use App\Models\User;

class ReviewService
{
    public function createForBuilding(User $user, Building $building, array $data): Review
    {
        $verified = Lease::query()
            ->where('tenant_id', $user->id)
            ->whereHas('apartment', function ($query) use ($building) {
                $query->where('building_id', $building->id);
            })
            ->exists();

        return $building->reviews()->create([
            'user_id' => $user->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'],
            'verified' => $verified,
        ]);
    }

    public function createForApartment(User $user, Apartment $apartment, array $data): Review
    {
        $verified = Lease::query()
            ->where('tenant_id', $user->id)
            ->where('apartment_id', $apartment->id)
            ->exists();

        return $apartment->reviews()->create([
            'user_id' => $user->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'],
            'verified' => $verified,
        ]);
    }
}
