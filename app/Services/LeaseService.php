<?php

namespace App\Services;

use App\Models\Lease;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaseService
{
    public function create(array $data): Lease
    {
        return DB::transaction(function () use ($data): Lease {
            $apartmentId = $data['apartment_id'] ?? null;

            $hasActiveLease = Lease::query()
                ->where('apartment_id', $apartmentId)
                ->where('status', 'active')
                ->lockForUpdate()
                ->exists();

            if ($hasActiveLease) {
                throw ValidationException::withMessages([
                    'apartment_id' => 'Apartment already has an active lease.',
                ]);
            }

            return Lease::create($data);
        });
    }
}
