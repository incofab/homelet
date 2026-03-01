<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use Illuminate\Http\JsonResponse;

class PublicBuildingForSaleController extends Controller
{
    public function index(): JsonResponse
    {
        $buildings = paginateFromRequest(Building::query()
            ->where('for_sale', true)
            ->with(['media'])
            ->latest('id'));

        return response()->json([
            'success' => true,
            'message' => 'Buildings for sale loaded.',
            'data' => [
                'buildings' => $buildings,
            ],
            'errors' => null,
        ]);
    }
}
