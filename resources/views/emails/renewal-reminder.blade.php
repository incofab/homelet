<p>Hello {{ $lease->tenant?->name ?? 'there' }},</p>
<p>Your lease is set to end on {{ optional($lease->end_date)->toDateString() }}.</p>
<p>Please contact management if you would like to renew.</p>
