<?php

namespace App\Http\Requests\Apartment;

use App\Http\Requests\ApiRequest;

class LookupTenantRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_email' => ['nullable', 'email', 'max:255', 'required_without:tenant_phone'],
            'tenant_phone' => ['nullable', 'string', 'regex:/^\d+$/', 'max:20', 'required_without:tenant_email'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'tenant_email' => $this->filled('tenant_email') ? mb_strtolower(trim((string) $this->input('tenant_email'))) : null,
            'tenant_phone' => $this->filled('tenant_phone') ? normalizePhoneNumber($this->input('tenant_phone')) : null,
        ]);
    }
}
