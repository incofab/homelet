<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TenantResolver
{
    public function findByContactDetails(?string $email, ?string $phone): ?User
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

    public function resolveForAssignment(?string $email, ?string $phone, ?string $name): User
    {
        $tenant = $this->findByContactDetails($email, $phone);
        $name = trim((string) $name);

        if (! $tenant && ! $email && ! $phone) {
            throw ValidationException::withMessages([
                'tenant_email' => ['Either a tenant email or phone number is required.'],
                'tenant_phone' => ['Either a tenant phone number or email is required.'],
            ]);
        }

        if (! $tenant) {
            if ($name === '') {
                throw ValidationException::withMessages([
                    'tenant_name' => ['Tenant name is required when creating a new tenant.'],
                ]);
            }

            return User::create([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'password' => Hash::make('password'),
            ]);
        }

        $updates = [];

        if ($name !== '' && $tenant->name !== $name) {
            $updates['name'] = $name;
        }

        if ($phone && ! $tenant->phone) {
            $updates['phone'] = $phone;
        } elseif ($phone && $tenant->phone !== $phone) {
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

        return $tenant;
    }
}
