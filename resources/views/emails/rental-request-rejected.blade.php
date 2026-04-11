<p>Hello {{ $rentalRequest->name ?? 'there' }},</p>
<p>Your rental request has been reviewed and was not approved.</p>
<p>
    <strong>Apartment:</strong>
    {{ $rentalRequest->apartment?->unit_code ?? 'Apartment' }}
    @if ($rentalRequest->apartment?->building?->name)
        · {{ $rentalRequest->apartment->building->name }}
    @endif
</p>
@if ($rentalRequest->rejection_reason)
    <p><strong>Reason:</strong> {{ $rentalRequest->rejection_reason }}</p>
@endif
<p>Thank you for your interest.</p>
