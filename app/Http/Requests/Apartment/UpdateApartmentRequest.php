<?php

namespace App\Http\Requests\Apartment;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class UpdateApartmentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'unit_code' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', Rule::in([
                'one_room',
                'self_contain',
                'one_bedroom',
                'two_bedroom',
                'three_bedroom',
                'custom',
            ])],
            'yearly_price' => ['sometimes', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'floor' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['vacant', 'occupied', 'maintenance'])],
            'is_public' => ['sometimes', 'boolean'],
            'amenities' => ['nullable', 'array'],
        ];
    }
}
