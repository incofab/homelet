<?php

namespace App\Http\Requests\Apartment;

use App\Http\Requests\ApiRequest;

class AssignTenantRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_email' => ['nullable', 'email', 'max:255'],
            'tenant_phone' => ['required', 'string', 'regex:/^\d+$/', 'max:20'],
            'tenant_name' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'rent_amount' => ['nullable', 'integer', 'min:0'],
            'record_payment' => ['nullable', 'boolean'],
            'payment_amount' => ['nullable', 'integer', 'min:0', 'required_if:record_payment,1,true'],
            'payment_date' => ['nullable', 'date', 'required_if:record_payment,1,true'],
            'payment_due_date' => ['nullable', 'date'],
            'payment_status' => ['nullable', 'in:pending,paid,failed'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'tenant_email' => $this->filled('tenant_email') ? mb_strtolower(trim((string) $this->input('tenant_email'))) : null,
            'tenant_phone' => normalizePhoneNumber($this->input('tenant_phone')),
        ]);
    }
}
