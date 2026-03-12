<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Apartment\AssignTenantRequest;
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

    public function assignTenant(AssignTenantRequest $request, Apartment $apartment, LeaseService $leaseService): JsonResponse
    {
        $this->authorize('assignTenant', $apartment);

        $tenant = null;
        $lease = null;

        DB::transaction(function () use ($request, $apartment, $leaseService, &$tenant, &$lease): void {
            $email = $request->string('tenant_email')->toString();
            $name = $request->string('tenant_name')->toString();

            $tenant = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name !== '' ? $name : Str::before($email, '@'),
                    'password' => Hash::make('password'),
                ]
            );

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
}
