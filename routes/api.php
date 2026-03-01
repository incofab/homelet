<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ApartmentController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\BuildingManagerController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PublicApartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'ok',
    ], 200);
});

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('buildings', BuildingController::class);
    Route::post('buildings/{building}/managers', [BuildingManagerController::class, 'store']);
    Route::delete('buildings/{building}/managers/{user}', [BuildingManagerController::class, 'destroy']);
    Route::post('buildings/{building}/apartments', [ApartmentController::class, 'store']);
    Route::get('buildings/{building}/apartments', [ApartmentController::class, 'index']);
    Route::get('apartments/{apartment}', [ApartmentController::class, 'show']);
    Route::put('apartments/{apartment}', [ApartmentController::class, 'update']);
    Route::delete('apartments/{apartment}', [ApartmentController::class, 'destroy']);
    Route::post('apartments/{apartment}/assign-tenant', [ApartmentController::class, 'assignTenant']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments', [PaymentController::class, 'index']);
    Route::get('tenant/payments', [PaymentController::class, 'tenantIndex']);
});

Route::get('public/apartments', [PublicApartmentController::class, 'index']);
