<?php

namespace App\Http\Requests\MaintenanceRequest;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class StoreMaintenanceRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'apartment_id' => ['required', 'integer', 'exists:apartments,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
        ];
    }
}
