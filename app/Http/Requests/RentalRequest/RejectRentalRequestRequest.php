<?php

namespace App\Http\Requests\RentalRequest;

use App\Http\Requests\ApiRequest;

class RejectRentalRequestRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
