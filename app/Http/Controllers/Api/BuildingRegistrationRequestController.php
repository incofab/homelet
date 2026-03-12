<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\StoreBuildingRegistrationRequest;
use App\Models\BuildingRegistrationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class BuildingRegistrationRequestController extends Controller
{
    public function store(StoreBuildingRegistrationRequest $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $payload = $request->validated();

        $requestData = [
            'status' => BuildingRegistrationRequest::STATUS_PENDING,
            'user_id' => $user?->id,
            'name' => $payload['name'],
            'address_line1' => $payload['address_line1'],
            'address_line2' => $payload['address_line2'] ?? null,
            'city' => $payload['city'],
            'state' => $payload['state'],
            'country' => $payload['country'],
            'description' => $payload['description'] ?? null,
            'for_sale' => $payload['for_sale'] ?? false,
            'sale_price' => $payload['sale_price'] ?? null,
        ];

        if ($user) {
            $requestData['owner_name'] = $user->name;
            $requestData['owner_email'] = $user->email;
            $requestData['owner_phone'] = $user->phone;
        } else {
            $requestData['owner_name'] = $payload['owner_name'];
            $requestData['owner_email'] = $payload['owner_email'] ?? null;
            $requestData['owner_phone'] = $payload['owner_phone'];
            $requestData['owner_password'] = Hash::make($payload['owner_password']);
        }

        $buildingRequest = BuildingRegistrationRequest::create($requestData);

        return $this->success('Building registration request submitted.', [
            'request' => $buildingRequest,
        ], 201);
    }
}
