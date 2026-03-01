<?php

namespace App\Providers;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\RentalRequest;
use App\Models\Conversation;
use App\Policies\ApartmentPolicy;
use App\Policies\BuildingPolicy;
use App\Policies\LeasePolicy;
use App\Policies\PaymentPolicy;
use App\Policies\RentalRequestPolicy;
use App\Policies\ConversationPolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
        Gate::define('manageManagers', [BuildingPolicy::class, 'manageManagers']);
    }
}
