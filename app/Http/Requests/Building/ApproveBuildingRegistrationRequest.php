<?php

namespace App\Http\Requests\Building;

use App\Http\Requests\ApiRequest;

class ApproveBuildingRegistrationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}
