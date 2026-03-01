<?php

namespace App\Http\Requests\RentalRequest;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class UpdateRentalRequestRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['new', 'contacted', 'closed'])],
        ];
    }
}
