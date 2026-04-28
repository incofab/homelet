<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_USER = 'user';

    public const DASHBOARD_ADMIN = 'admin';

    public const DASHBOARD_TENANT = 'tenant';

    public const DASHBOARD_HOME = 'home';

    protected $appends = [
        'role',
        'dashboard',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            $user->email = $user->email ? mb_strtolower(trim($user->email)) : null;
            $user->phone = normalizePhoneNumber($user->phone);
        });

        static::created(function (User $user): void {
            $user->assignRole(Role::findOrCreate(self::ROLE_USER));
        });
    }

    public function scopeWhereIdentifier(Builder $query, string $identifier): Builder
    {
        $normalizedPhone = normalizePhoneNumber($identifier);
        $normalizedEmail = mb_strtolower(trim($identifier));

        return $query->where(function (Builder $builder) use ($normalizedPhone, $normalizedEmail) {
            $builder->where('email', $normalizedEmail);

            if ($normalizedPhone) {
                $builder->orWhere('phone', $normalizedPhone);
            }
        });
    }

    public function getRoleAttribute(): string
    {
        if ($this->isPlatformAdmin()) {
            return self::ROLE_ADMIN;
        }

        if (Building::query()->where('owner_id', $this->id)->exists()) {
            return Building::ROLE_LANDLORD;
        }

        $buildingRole = $this->buildings()
            ->select('building_users.role')
            ->whereIn('building_users.role', [
                Building::ROLE_LANDLORD,
                Building::ROLE_MANAGER,
                Building::ROLE_CARETAKER,
            ])
            ->orderByRaw(
                'case building_users.role when ? then 0 when ? then 1 when ? then 2 else 3 end',
                [Building::ROLE_LANDLORD, Building::ROLE_MANAGER, Building::ROLE_CARETAKER]
            )
            ->value('building_users.role');

        if (is_string($buildingRole) && $buildingRole !== '') {
            return $buildingRole;
        }

        if ($this->shouldUseTenantDashboard()) {
            return self::DASHBOARD_TENANT;
        }

        return self::ROLE_USER;
    }

    public function getDashboardAttribute(): string
    {
        if ($this->isPlatformAdmin() || $this->isBuildingUser()) {
            return self::DASHBOARD_ADMIN;
        }

        if ($this->shouldUseTenantDashboard()) {
            return self::DASHBOARD_TENANT;
        }

        return self::DASHBOARD_HOME;
    }

    public function buildings()
    {
        return $this->belongsToMany(Building::class, 'building_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function leases()
    {
        return $this->hasMany(Lease::class, 'tenant_id');
    }

    public function activeLease()
    {
        return $this->hasOne(Lease::class, 'tenant_id')
            ->where('status', 'active')
            ->latestOfMany();
    }

    public function latestLease()
    {
        return $this->hasOne(Lease::class, 'tenant_id')->latestOfMany();
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'tenant_id');
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function maintenanceRequests()
    {
        return $this->hasMany(MaintenanceRequest::class, 'tenant_id');
    }

    public function recordedExpenses()
    {
        return $this->hasMany(Expense::class, 'recorded_by');
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'model');
    }

    public function profileMedia()
    {
        return $this->morphOne(Media::class, 'model')->where('collection', 'profile');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function isPlatformAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN);
    }

    public function isBuildingUser(): bool
    {
        return Building::query()
            ->where('owner_id', $this->id)
            ->orWhereHas('users', function (Builder $query): void {
                $query->where('users.id', $this->id);
            })
            ->exists();
    }

    public function shouldUseTenantDashboard(): bool
    {
        return $this->activeLease()->exists();
    }

    public function dashboardContext(): array
    {
        $isPlatformAdmin = $this->isPlatformAdmin();
        $isBuildingUser = $this->isBuildingUser();
        $hasActiveLease = $this->shouldUseTenantDashboard();

        $availableDashboards = [];

        if ($isPlatformAdmin || $isBuildingUser) {
            $availableDashboards[] = self::DASHBOARD_ADMIN;
        }

        if ($hasActiveLease) {
            $availableDashboards[] = self::DASHBOARD_TENANT;
        }

        if ($availableDashboards === []) {
            $availableDashboards[] = self::DASHBOARD_HOME;
        }

        return [
            'primary_dashboard' => $this->dashboard,
            'is_platform_admin' => $isPlatformAdmin,
            'is_building_user' => $isBuildingUser,
            'has_active_lease' => $hasActiveLease,
            'available_dashboards' => $availableDashboards,
        ];
    }

    public function hasBuildingRole(Building $building, string|array $roles): bool
    {
        if ($this->isPlatformAdmin()) {
            return true;
        }

        $roles = is_array($roles) ? $roles : [$roles];

        if (in_array(Building::ROLE_LANDLORD, $roles, true) && $this->id === $building->owner_id) {
            return true;
        }

        return $this->buildings()
            ->where('buildings.id', $building->id)
            ->wherePivotIn('role', $roles)
            ->exists();
    }

    public function ownedBuildingIds()
    {
        return Building::query()
            ->where('owner_id', $this->id)
            ->pluck('id');
    }

    public function buildingIdsForRoles(array $roles)
    {
        if ($this->isPlatformAdmin()) {
            return Building::query()->pluck('id');
        }

        $owned = in_array(Building::ROLE_LANDLORD, $roles, true)
            ? $this->ownedBuildingIds()
            : collect();

        $assigned = $this->buildings()
            ->wherePivotIn('role', $roles)
            ->pluck('buildings.id');

        return $owned->merge($assigned)->unique()->values();
    }

    public function canManageBuilding(Building $building): bool
    {
        return $this->hasBuildingRole($building, [Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);
    }

    public function canViewBuilding(Building $building): bool
    {
        return $this->hasBuildingRole($building, [
            Building::ROLE_LANDLORD,
            Building::ROLE_MANAGER,
            Building::ROLE_CARETAKER,
        ]);
    }

    public function canHandleMaintenance(Building $building): bool
    {
        return $this->hasBuildingRole($building, [
            Building::ROLE_LANDLORD,
            Building::ROLE_MANAGER,
            Building::ROLE_CARETAKER,
        ]);
    }

    public function isTenantInBuilding(Building $building): bool
    {
        return $this->leases()
            ->where('status', 'active')
            ->whereHas('apartment', function ($query) use ($building) {
                $query->where('building_id', $building->id);
            })
            ->exists();
    }
}
