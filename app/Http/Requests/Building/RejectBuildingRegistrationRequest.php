<?php

namespace App\Http\Requests\Building;

use App\Http\Requests\ApiRequest;

class RejectBuildingRegistrationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:500'],
        ];
    }
}
