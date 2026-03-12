<?php

namespace App\Providers;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\RentalRequest;
use App\Models\User;
use App\Policies\ApartmentPolicy;
use App\Policies\BuildingPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\LeasePolicy;
use App\Policies\MaintenanceRequestPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\RentalRequestPolicy;
use App\Policies\TenantPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        config([
            'permission.models.role' => \App\Models\Role::class,
            'permission.models.permission' => \App\Models\Permission::class,
        ]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Building::class, BuildingPolicy::class);
        Gate::policy(Apartment::class, ApartmentPolicy::class);
        Gate::policy(Lease::class, LeasePolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(RentalRequest::class, RentalRequestPolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(MaintenanceRequest::class, MaintenanceRequestPolicy::class);
        Gate::policy(User::class, TenantPolicy::class);
        Gate::define('manageManagers', [BuildingPolicy::class, 'manageRoles']);
    }
}
