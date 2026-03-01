<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Apartment;
use Illuminate\Http\JsonResponse;

class PublicApartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $apartments = paginateFromRequest(Apartment::query()
            ->where('status', 'vacant')
            ->where('is_public', true)
            ->with(['building:id,name,address_line1,address_line2,city,state,country', 'media'])
            ->latest('id'));

        return response()->json([
            'success' => true,
            'message' => 'Public apartments loaded.',
            'data' => [
                'apartments' => $apartments,
            ],
            'errors' => null,
        ]);
    }
}
