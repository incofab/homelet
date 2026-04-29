<?php

namespace App\Providers;

use App\Contracts\SendsSms;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\RentalRequest;
use App\Models\User;
use App\Policies\ApartmentPolicy;
use App\Policies\BuildingPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\LeasePolicy;
use App\Policies\MaintenanceRequestPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\RentalRequestPolicy;
use App\Policies\TenantPolicy;
use App\Services\LogSmsService;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use SplFileInfo;

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

        $this->app->bind(SendsSms::class, LogSmsService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::morphMap($this->buildMorphMap());

        Gate::policy(Building::class, BuildingPolicy::class);
        Gate::policy(Apartment::class, ApartmentPolicy::class);
        Gate::policy(Lease::class, LeasePolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Expense::class, ExpensePolicy::class);
        Gate::policy(ExpenseCategory::class, ExpenseCategoryPolicy::class);
        Gate::policy(RentalRequest::class, RentalRequestPolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(MaintenanceRequest::class, MaintenanceRequestPolicy::class);
        Gate::policy(User::class, TenantPolicy::class);
        Gate::define('manageManagers', [BuildingPolicy::class, 'manageRoles']);

        Schema::defaultStringLength(191);
    }

    /**
     * @return array<string, class-string>
     */
    private function buildMorphMap(): array
    {
        return collect(File::files(app_path('Models')))
            ->mapWithKeys(function (SplFileInfo $file): array {
                $classBaseName = $file->getBasename('.php');
                $modelClass = 'App\\Models\\'.$classBaseName;

                return [
                    $modelClass => $modelClass,
                    Str::snake($classBaseName) => $modelClass,
                    Str::snake($classBaseName, '-') => $modelClass,
                ];
            })
            ->all();
    }
}