<?php

namespace App\Http\Requests\Building;

use App\Http\Requests\ApiRequest;

class StoreBuildingManagerRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
