<?php

namespace App\Http\Requests\RentalRequest;

use App\Http\Requests\ApiRequest;

class StoreRentalRequestPublicRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'apartment_id' => ['required', 'integer', 'exists:apartments,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'message' => ['nullable', 'string'],
        ];
    }
}
