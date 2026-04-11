<?php

namespace App\Services;

use App\Contracts\SendsSms;
use App\Mail\RentalRequestRejectedMail;
use App\Models\Apartment;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class RentalRequestWorkflowService
{
    public function __construct(
        private readonly TenantAssignmentService $tenantAssignmentService,
        private readonly SendsSms $smsSender,
    ) {}

    public function approve(RentalRequest $rentalRequest, User $actor, array $payload): array
    {
        $this->guardPendingAction($rentalRequest, 'approve');

        $apartment = $this->resolveApprovalApartment($rentalRequest, $actor, $payload['apartment_id'] ?? null);

        $assignment = $this->tenantAssignmentService->assign($apartment, [
            'tenant_email' => $rentalRequest->email,
            'tenant_phone' => $rentalRequest->phone,
            'tenant_name' => $rentalRequest->name,
            'start_date' => $payload['start_date'],
            'rent_amount' => $payload['rent_amount'] ?? null,
            'record_payment' => $payload['record_payment'] ?? false,
            'payment_amount' => $payload['payment_amount'] ?? null,
            'payment_date' => $payload['payment_date'] ?? null,
            'payment_due_date' => $payload['payment_due_date'] ?? null,
            'payment_status' => $payload['payment_status'] ?? null,
            'payment_reference' => $payload['payment_reference'] ?? null,
        ]);

        DB::transaction(function () use ($rentalRequest, $actor, $assignment): void {
            $rentalRequest->update([
                'status' => RentalRequest::STATUS_APPROVED,
                'apartment_id' => $assignment['lease']?->apartment_id,
                'tenant_id' => $assignment['tenant']?->id,
                'lease_id' => $assignment['lease']?->id,
                'approved_by' => $actor->id,
                'approved_at' => now(),
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
            ]);
        });

        return [
            'rental_request' => $rentalRequest->fresh(['apartment.building', 'tenant', 'lease']),
            'tenant' => $assignment['tenant'],
            'lease' => $assignment['lease'],
            'payment' => $assignment['payment'],
        ];
    }

    public function reject(RentalRequest $rentalRequest, User $actor, ?string $reason = null): RentalRequest
    {
        $this->guardPendingAction($rentalRequest, 'reject');

        $rentalRequest->update([
            'status' => RentalRequest::STATUS_REJECTED,
            'rejected_by' => $actor->id,
            'rejected_at' => now(),
            'rejection_reason' => $reason ? trim($reason) : null,
        ]);

        $rentalRequest->refresh();

        if ($rentalRequest->email) {
            Mail::to($rentalRequest->email)->send(new RentalRequestRejectedMail($rentalRequest));
        }

        if ($rentalRequest->phone) {
            $this->smsSender->send($rentalRequest->phone, $this->buildRejectionSmsMessage($rentalRequest));
        }

        return $rentalRequest->fresh(['apartment.building']);
    }

    private function guardPendingAction(RentalRequest $rentalRequest, string $action): void
    {
        if (! in_array($rentalRequest->status, [
            RentalRequest::STATUS_NEW,
            RentalRequest::STATUS_CONTACTED,
        ], true)) {
            throw ValidationException::withMessages([
                'rental_request' => [sprintf(
                    'Rental request cannot be %s after it has been %s.',
                    $action.'d',
                    $rentalRequest->status
                )],
            ]);
        }
    }

    private function resolveApprovalApartment(RentalRequest $rentalRequest, User $actor, int|string|null $apartmentId): Apartment
    {
        $apartment = $apartmentId
            ? Apartment::query()->with('building')->findOrFail($apartmentId)
            : $rentalRequest->apartment;

        if (! $apartment) {
            throw ValidationException::withMessages([
                'apartment_id' => ['Select an apartment before approving this rental request.'],
            ]);
        }

        if (! $apartment->building || ! $actor->canManageBuilding($apartment->building)) {
            throw ValidationException::withMessages([
                'apartment_id' => ['You cannot approve a rental request for this apartment.'],
            ]);
        }

        $requestedBuildingId = $rentalRequest->apartment?->building_id;

        if ($requestedBuildingId && $requestedBuildingId !== $apartment->building_id) {
            throw ValidationException::withMessages([
                'apartment_id' => ['Select an apartment in the same building as the rental request.'],
            ]);
        }

        return $apartment;
    }

    private function buildRejectionSmsMessage(RentalRequest $rentalRequest): string
    {
        $apartmentLabel = $rentalRequest->apartment?->unit_code ?? 'the apartment';
        $buildingName = $rentalRequest->apartment?->building?->name;
        $target = $buildingName ? sprintf('%s at %s', $apartmentLabel, $buildingName) : $apartmentLabel;

        return sprintf(
            'Hello %s, your rental request for %s was not approved.%s',
            $rentalRequest->name ?: 'there',
            $target,
            $rentalRequest->rejection_reason ? ' Reason: '.$rentalRequest->rejection_reason : ''
        );
    }
}
