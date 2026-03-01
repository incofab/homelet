<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function indexBuilding(Request $request, Building $building): JsonResponse
    {
        $reviews = paginateFromRequest(
            $building->reviews()
                ->with('user:id,name')
                ->latest('id')
        );

        return $this->success('Building reviews loaded.', [
            'reviews' => $reviews,
        ]);
    }

    public function storeBuilding(StoreReviewRequest $request, Building $building): JsonResponse
    {
        $user = $request->user();

        $verified = Lease::query()
            ->where('tenant_id', $user->id)
            ->whereHas('apartment', function ($query) use ($building) {
                $query->where('building_id', $building->id);
            })
            ->exists();

        $review = $building->reviews()->create([
            'user_id' => $user->id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'verified' => $verified,
        ]);

        return $this->success('Building review created.', [
            'review' => $review->load('user:id,name'),
        ], 201);
    }

    public function indexApartment(Request $request, Apartment $apartment): JsonResponse
    {
        $reviews = paginateFromRequest(
            $apartment->reviews()
                ->with('user:id,name')
                ->latest('id')
        );

        return $this->success('Apartment reviews loaded.', [
            'reviews' => $reviews,
        ]);
    }

    public function storeApartment(StoreReviewRequest $request, Apartment $apartment): JsonResponse
    {
        $user = $request->user();

        $verified = Lease::query()
            ->where('tenant_id', $user->id)
            ->where('apartment_id', $apartment->id)
            ->exists();

        $review = $apartment->reviews()->create([
            'user_id' => $user->id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'verified' => $verified,
        ]);

        return $this->success('Apartment review created.', [
            'review' => $review->load('user:id,name'),
        ], 201);
    }
}
