<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Apartment\AssignTenantRequest;
use App\Http\Requests\Apartment\LookupTenantRequest;
use App\Http\Requests\Apartment\StoreApartmentRequest;
use App\Http\Requests\Apartment\UpdateApartmentRequest;
use App\Models\Apartment;
use App\Models\Building;
use App\Services\TenantAssignmentService;
use App\Support\ApartmentDataFormatter;
use App\Support\TenantResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApartmentController extends Controller
{
    public function __construct(
        private readonly ApartmentDataFormatter $apartmentDataFormatter,
        private readonly TenantResolver $tenantResolver,
    ) {}

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

        $apartments = collect($request->apartmentPayloads())
            ->map(fn (array $payload): Apartment => $building->apartments()->create($payload));
        $apartment = $apartments->first();

        return $this->success($apartments->count() === 1 ? 'Apartment created.' : 'Apartments created.', [
            'apartment' => $apartment,
            'apartments' => $apartments->values(),
            'created_count' => $apartments->count(),
        ], 201);
    }

    public function show(Request $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('view', $apartment);

        return $this->success('Apartment loaded.', [
            'apartment' => $this->apartmentDataFormatter->format($apartment),
        ]);
    }

    public function update(UpdateApartmentRequest $request, Apartment $apartment): JsonResponse
    {
        $this->authorize('update', $apartment);

        $apartment->update($request->validated());

        return $this->success('Apartment updated.', [
            'apartment' => $this->apartmentDataFormatter->format($apartment->refresh()),
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

        $tenant = $this->tenantResolver->findByContactDetails(
            $request->input('tenant_email'),
            $request->input('tenant_phone'),
        );

        return $this->success('Tenant lookup completed.', [
            'exists' => (bool) $tenant,
            'requires_name' => ! $tenant,
            'tenant' => $tenant,
        ]);
    }

    public function assignTenant(
        AssignTenantRequest $request,
        Apartment $apartment,
        TenantAssignmentService $tenantAssignmentService
    ): JsonResponse {
        $this->authorize('assignTenant', $apartment);

        $assignment = $tenantAssignmentService->assign($apartment, $request->validated());

        return $this->success('Tenant assigned.', [
            'tenant' => $assignment['tenant'],
            'lease' => $assignment['lease'],
            'payment' => $assignment['payment'],
            'apartment' => $this->apartmentDataFormatter->format($apartment->refresh()),
        ], 201);
    }
}
