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
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'for_sale' => ['nullable', 'boolean'],
            'sale_price' => ['nullable', 'integer', 'min:0', 'required_if:for_sale,1,true'],
        ];

        if (! auth('sanctum')->check()) {
            $rules['owner_name'] = ['required', 'string', 'max:255'];
            $rules['owner_email'] = ['required', 'string', 'email', 'max:255', 'unique:users,email'];
            $rules['owner_phone'] = ['required', 'string', 'max:50'];
            $rules['owner_password'] = ['required', 'string', 'min:8', 'confirmed'];
        } else {
            $rules['owner_name'] = ['nullable', 'string', 'max:255'];
            $rules['owner_email'] = ['nullable', 'string', 'email', 'max:255'];
            $rules['owner_phone'] = ['nullable', 'string', 'max:50'];
            $rules['owner_password'] = ['nullable', 'string', 'min:8', 'confirmed'];
        }

        return $rules;
    }
}
