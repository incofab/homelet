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
            'tenant_email' => ['required', 'email'],
            'tenant_name' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'rent_amount' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
