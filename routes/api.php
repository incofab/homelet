<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\BuildingManagerController;
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
});
