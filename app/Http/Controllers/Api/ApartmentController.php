<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Apartment\AssignTenantRequest;
use App\Http\Requests\Apartment\LookupTenantRequest;
use App\Http\Requests\Apartment\StoreApartmentRequest;
use App\Http\Requests\Apartment\UpdateApartmentRequest;
use App\Jobs\SendTenancyAgreementEmail;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\User;
use App\Services\LeaseService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ApartmentController extends Controller
{
    public function index(Request $request, Building $building): JsonResponse
    {
        $this->authorize('viewAny', [Apartment::class, $building]);

        $apartments = paginateFromRequest(
            $building->apartments()->with('media')->latest('id')
        );

        return $this->success('Apartments loaded.', [
            'apartments' => $apartments,
        ]);
    }

    public function store(StoreApartmentRequest $request, Building $building): JsonResponse
    {
        $this->authorize('create', [Apartment::class, $building]);

        $apartment = $building->apartments()->create($request->validated());

        return $this->success('Apartment created.', [
            'apartment' => $apartment,
        ], 201);
    }

    public function show(Request $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('view', $apartment);

        return $this->success('Apartment loaded.', [
            'apartment' => $apartment->load('media'),
        ]);
    }

    public function update(UpdateApartmentRequest $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('update', $apartment);

        $apartment->update($request->validated());

        return $this->success('Apartment updated.', [
            'apartment' => $apartment->refresh()->load('media'),
        ]);
    }

    public function destroy(Request $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('delete', $apartment);

        if ($apartment->tenants()->exists() || $apartment->status === 'occupied') {
            return response()->json([
                'success' => false,
                'message' => 'Apartment has an active lease and cannot be deleted.',
                'data' => null,
                'errors' => null,
            ], 409);
        }

        $apartment->delete();

        return $this->success('Apartment deleted.');
    }

    public function lookupTenant(LookupTenantRequest $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('assignTenant', $apartment);

        $tenant = $this->resolveTenantFromContactDetails(
            $request->input('tenant_email'),
            $request->input('tenant_phone'),
        );

        return $this->success('Tenant lookup completed.', [
            'exists' => (bool) $tenant,
            'requires_name' => ! $tenant,
            'tenant' => $tenant,
        ]);
    }

    public function assignTenant(AssignTenantRequest $request, Apartment $apartment, LeaseService $leaseService): JsonResponse
    {
        $this->authorize('assignTenant', $apartment);

        $tenant = null;
        $lease = null;

        DB::transaction(function () use ($request, $apartment, $leaseService, &$tenant, &$lease): void {
            $email = $request->input('tenant_email');
            $phone = $request->string('tenant_phone')->toString();
            $name = $request->string('tenant_name')->toString();

            $tenant = $this->resolveTenantFromContactDetails($email, $phone);

            if (! $tenant) {
                if ($name === '') {
                    throw ValidationException::withMessages([
                        'tenant_name' => ['Tenant name is required when creating a new tenant.'],
                    ]);
                }

                $tenant = User::create([
                    'name' => $name,
                    'email' => $email,
                    'phone' => $phone,
                    'password' => Hash::make('password'),
                ]);
            } else {
                $updates = [];

                if ($name !== '' && $tenant->name !== $name) {
                    $updates['name'] = $name;
                }

                if (! $tenant->phone) {
                    $updates['phone'] = $phone;
                } elseif ($tenant->phone !== $phone) {
                    throw ValidationException::withMessages([
                        'tenant_phone' => ['Phone number does not match the existing user record.'],
                    ]);
                }

                if ($email && ! $tenant->email) {
                    $updates['email'] = $email;
                } elseif ($email && $tenant->email !== $email) {
                    throw ValidationException::withMessages([
                        'tenant_email' => ['Email does not match the existing user record.'],
                    ]);
                }

                if ($updates !== []) {
                    $tenant->update($updates);
                }
            }

            $apartment->tenants()->syncWithoutDetaching([$tenant->id]);

            $startDate = Carbon::parse($request->date('start_date'));
            $rentAmount = $request->input('rent_amount', $apartment->yearly_price);

            $lease = $leaseService->create([
                'apartment_id' => $apartment->id,
                'tenant_id' => $tenant->id,
                'rent_amount' => $rentAmount,
                'start_date' => $startDate->toDateString(),
                'end_date' => $startDate->copy()->addYear()->toDateString(),
                'status' => 'active',
            ]);

            $apartment->update(['status' => 'occupied']);
        });

        if ($lease) {
            SendTenancyAgreementEmail::dispatch($lease);
        }

        return $this->success('Tenant assigned.', [
            'tenant' => $tenant,
            'lease' => $lease,
            'apartment' => $apartment->refresh()->load('media'),
        ], 201);
    }

    private function resolveTenantFromContactDetails(?string $email, ?string $phone): ?User
    {
        $tenantByPhone = $phone ? User::query()->where('phone', $phone)->first() : null;
        $tenantByEmail = $email ? User::query()->where('email', $email)->first() : null;

        if ($tenantByPhone && $tenantByEmail && $tenantByPhone->id !== $tenantByEmail->id) {
            throw ValidationException::withMessages([
                'tenant_phone' => ['Phone number belongs to a different user than the supplied email.'],
                'tenant_email' => ['Email belongs to a different user than the supplied phone number.'],
            ]);
        }

        return $tenantByPhone ?? $tenantByEmail;
    }
}
