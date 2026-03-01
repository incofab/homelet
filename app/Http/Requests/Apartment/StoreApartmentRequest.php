<?php

namespace App\Http\Requests\Apartment;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class StoreApartmentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'unit_code' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in([
                'one_room',
                'self_contain',
                'one_bedroom',
                'two_bedroom',
                'three_bedroom',
                'custom',
            ])],
            'yearly_price' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'floor' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['vacant', 'occupied', 'maintenance'])],
            'is_public' => ['nullable', 'boolean'],
            'amenities' => ['nullable', 'array'],
        ];
    }
}
