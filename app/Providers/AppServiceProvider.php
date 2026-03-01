<?php

namespace App\Providers;

use App\Models\Apartment;
use App\Models\Building;
use App\Policies\ApartmentPolicy;
use App\Policies\BuildingPolicy;
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
        Gate::define('manageManagers', [BuildingPolicy::class, 'manageManagers']);
    }
}
