@php
    $ownerName = $request->user?->name ?? $request->owner_name ?? 'there';
@endphp

<p>Hi {{ $ownerName }},</p>
<p>Your building registration request was not approved.</p>
<p><strong>Building:</strong> {{ $request->name }}</p>
<p><strong>Reason:</strong> {{ $request->rejection_reason ?? 'Not specified' }}</p>
