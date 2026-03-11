@php
    $ownerName = $request->user?->name ?? $request->owner_name ?? 'there';
@endphp

<p>Hi {{ $ownerName }},</p>
<p>Your building registration request has been approved.</p>
<p><strong>Building:</strong> {{ $request->name }}</p>
<p>You can now sign in and manage your building on the platform.</p>
