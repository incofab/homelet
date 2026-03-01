<?php

namespace App\Http\Requests\MaintenanceRequest;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class UpdateMaintenanceRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['open', 'in_progress', 'resolved'])],
        ];
    }
}
