<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Apartment;
use App\Models\Building;
use App\Services\ReviewService;
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

    public function storeBuilding(
        StoreReviewRequest $request,
        Building $building,
        ReviewService $reviewService
    ): JsonResponse {
        $review = $reviewService->createForBuilding($request->user(), $building, $request->validated());

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

    public function storeApartment(
        StoreReviewRequest $request,
        Apartment $apartment,
        ReviewService $reviewService
    ): JsonResponse {
        $review = $reviewService->createForApartment($request->user(), $apartment, $request->validated());

        return $this->success('Apartment review created.', [
            'review' => $review->load('user:id,name'),
        ], 201);
    }
}
