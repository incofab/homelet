<p>Hello {{ $lease->tenant?->name ?? 'there' }},</p>
<p>Your tenancy agreement has been generated for apartment {{ $lease->apartment?->unit_code ?? 'N/A' }}.</p>
<p>Please find the agreement attached. It includes a clause stating that a quit notice will be issued automatically if the lease expires without renewal.</p>
<p>Thank you.</p>
