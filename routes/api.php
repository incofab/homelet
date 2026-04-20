<?php

use App\Http\Controllers\Api\Admin\BuildingRegistrationRequestController as AdminBuildingRegistrationRequestController;
use App\Http\Controllers\Api\ApartmentController;
use App\Http\Controllers\Api\ApartmentMediaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\BuildingManagerController;
use App\Http\Controllers\Api\BuildingMediaController;
use App\Http\Controllers\Api\BuildingRegistrationRequestController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\Dashboard\AdminDashboardController;
use App\Http\Controllers\Api\Dashboard\TenantDashboardController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\LeaseController;
use App\Http\Controllers\Api\MaintenanceRequestController;
use App\Http\Controllers\Api\MaintenanceRequestMediaController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileMediaController;
use App\Http\Controllers\Api\PublicApartmentController;
use App\Http\Controllers\Api\PublicBuildingController;
use App\Http\Controllers\Api\PublicBuildingForSaleController;
use App\Http\Controllers\Api\PublicRentalRequestController;
use App\Http\Controllers\Api\RentalRequestController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\UserController;
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
    Route::get('apartments/{apartment}', [ApartmentController::class, 'show']);
    Route::post('building-registration-requests', [BuildingRegistrationRequestController::class, 'store']);
    Route::post('buildings/{building}/managers', [BuildingManagerController::class, 'store']);
    Route::delete('buildings/{building}/managers/{user}', [BuildingManagerController::class, 'destroy']);
    Route::post('buildings/{building}/apartments', [ApartmentController::class, 'store']);
    Route::get('buildings/{building}/apartments', [ApartmentController::class, 'index']);
    Route::put('apartments/{apartment}', [ApartmentController::class, 'update']);
    Route::delete('apartments/{apartment}', [ApartmentController::class, 'destroy']);
    Route::post('apartments/{apartment}/assign-tenant/lookup', [ApartmentController::class, 'lookupTenant']);
    Route::post('apartments/{apartment}/assign-tenant', [ApartmentController::class, 'assignTenant']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('expenses', [ExpenseController::class, 'store']);
    Route::get('expenses', [ExpenseController::class, 'index']);
    Route::get('buildings/{building}/expense-categories', [ExpenseCategoryController::class, 'index']);
    Route::post('buildings/{building}/expense-categories', [ExpenseCategoryController::class, 'store']);
    Route::put('buildings/{building}/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'update']);
    Route::delete('buildings/{building}/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'destroy']);
    Route::get('tenant/payments', [PaymentController::class, 'tenantIndex']);
    Route::put('leases/{lease}/extend', [LeaseController::class, 'extend']);
    Route::post('leases/{lease}/renew', [LeaseController::class, 'renew']);
    Route::get('tenants', [TenantController::class, 'index']);
    Route::get('buildings/{building}/tenants', [TenantController::class, 'indexForBuilding']);
    Route::get('tenants/{tenant}', [TenantController::class, 'show']);
    Route::get('users', [UserController::class, 'index']);
    Route::post('users/{user}/impersonate', [UserController::class, 'impersonate']);
    Route::get('rental-requests', [RentalRequestController::class, 'index']);
    Route::put('rental-requests/{rentalRequest}', [RentalRequestController::class, 'update']);
    Route::post('rental-requests/{rentalRequest}/approve', [RentalRequestController::class, 'approve']);
    Route::post('rental-requests/{rentalRequest}/reject', [RentalRequestController::class, 'reject']);
    Route::post('conversations', [ConversationController::class, 'store']);
    Route::get('conversations', [ConversationController::class, 'index']);
    Route::get('conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('conversations/{conversation}/messages', [ConversationController::class, 'storeMessage']);
    Route::post('conversations/{conversation}/read', [ConversationController::class, 'markRead']);
    Route::get('dashboard/admin', AdminDashboardController::class);
    Route::get('dashboard/tenant', TenantDashboardController::class);
    Route::get('tenant/dashboard', TenantDashboardController::class);
    Route::post('maintenance-requests', [MaintenanceRequestController::class, 'store']);
    Route::get('maintenance-requests', [MaintenanceRequestController::class, 'index']);
    Route::get('maintenance-requests/{maintenanceRequest}', [MaintenanceRequestController::class, 'show']);
    Route::put('maintenance-requests/{maintenanceRequest}', [MaintenanceRequestController::class, 'update']);
    Route::get('buildings/{building}/media', [BuildingMediaController::class, 'index']);
    Route::post('buildings/{building}/media', [BuildingMediaController::class, 'store']);
    Route::delete('buildings/{building}/media/{media}', [BuildingMediaController::class, 'destroy']);
    Route::get('apartments/{apartment}/media', [ApartmentMediaController::class, 'index']);
    Route::post('apartments/{apartment}/media', [ApartmentMediaController::class, 'store']);
    Route::delete('apartments/{apartment}/media/{media}', [ApartmentMediaController::class, 'destroy']);
    Route::get('maintenance-requests/{maintenanceRequest}/media', [MaintenanceRequestMediaController::class, 'index']);
    Route::post('maintenance-requests/{maintenanceRequest}/media', [MaintenanceRequestMediaController::class, 'store']);
    Route::get('profile/media', [ProfileMediaController::class, 'show']);
    Route::post('profile/media', [ProfileMediaController::class, 'store']);
    Route::get('buildings/{building}/reviews', [ReviewController::class, 'indexBuilding']);
    Route::post('buildings/{building}/reviews', [ReviewController::class, 'storeBuilding']);
    Route::get('apartments/{apartment}/reviews', [ReviewController::class, 'indexApartment']);
    Route::post('apartments/{apartment}/reviews', [ReviewController::class, 'storeApartment']);
    Route::get('admin/building-registration-requests', [AdminBuildingRegistrationRequestController::class, 'index']);
    Route::get('admin/building-registration-requests/{buildingRegistrationRequest}', [AdminBuildingRegistrationRequestController::class, 'show']);
    Route::post('admin/building-registration-requests/{buildingRegistrationRequest}/approve', [AdminBuildingRegistrationRequestController::class, 'approve']);
    Route::post('admin/building-registration-requests/{buildingRegistrationRequest}/reject', [AdminBuildingRegistrationRequestController::class, 'reject']);
});

Route::middleware('throttle:60,1')->group(function () {
    Route::get('public/apartments', [PublicApartmentController::class, 'index']);
    Route::get('public/apartments/{apartment}', [PublicApartmentController::class, 'show']);
    Route::get('public/buildings', [PublicBuildingController::class, 'index']);
    Route::get('public/buildings/{building}', [PublicBuildingController::class, 'show']);
    Route::get('public/buildings-for-sale', [PublicBuildingForSaleController::class, 'index']);
    Route::get('public/rent-request-apartments/{apartment}', [PublicRentalRequestController::class, 'showApartment']);
    Route::post('public/rental-requests', [PublicRentalRequestController::class, 'store']);
    Route::post('public/request-interest', [PublicRentalRequestController::class, 'store']);
});
