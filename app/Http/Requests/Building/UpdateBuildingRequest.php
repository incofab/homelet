<?php

namespace App\Http\Requests\Building;

use App\Http\Requests\ApiRequest;

class UpdateBuildingRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'address_line1' => ['sometimes', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:255'],
            'state' => ['sometimes', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
            'country' => ['sometimes', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'formatted_address' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'for_sale' => ['sometimes', 'boolean'],
            'sale_price' => ['nullable', 'integer', 'min:0', 'required_if:for_sale,1,true'],
        ];
    }
}
