<?php

namespace App\Http\Requests\Building;

use App\Http\Requests\ApiRequest;

class StoreBuildingRegistrationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
            'country' => ['required', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'formatted_address' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'for_sale' => ['nullable', 'boolean'],
            'sale_price' => ['nullable', 'integer', 'min:0', 'required_if:for_sale,1,true'],
        ];
    }

    protected function prepareForValidation(): void
    {
        //
    }
}
