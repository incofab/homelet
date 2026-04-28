<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Apartment;
use Illuminate\Http\JsonResponse;

class PublicApartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $apartments = paginateFromRequest(
            Apartment::query()
                ->where('status', 'vacant')
                ->where('is_public', true)
                ->with([
                    'building:id,name,address_id,contact_email,contact_phone',
                    'building.address',
                    'media',
                ])
                ->latest('id')
        );

        return $this->success('Public apartments loaded.', [
            'apartments' => $apartments,
        ]);
    }

    public function show(Apartment $apartment): JsonResponse
    {
        abort_unless($apartment->is_public, 404);

        return $this->success('Public apartment loaded.', [
            'apartment' => $apartment->load([
                'building:id,name,address_id,contact_email,contact_phone',
                'building.address',
                'media',
                'reviews.user:id,name',
            ]),
        ]);
    }
}
