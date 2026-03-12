<?php

namespace App\Http\Requests\Building;

use App\Http\Requests\ApiRequest;
use App\Models\Building;
use Illuminate\Validation\Rule;

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
            'role' => ['required', 'string', Rule::in([
                Building::ROLE_LANDLORD,
                Building::ROLE_MANAGER,
                Building::ROLE_CARETAKER,
            ])],
        ];
    }
}
