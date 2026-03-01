<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lease_id' => ['required', 'integer', 'exists:leases,id'],
            'amount' => ['required', 'integer', 'min:0'],
            'payment_method' => ['required', Rule::in(['manual', 'online'])],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            'payment_date' => ['required', 'date'],
            'status' => ['nullable', Rule::in(['pending', 'paid', 'failed'])],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
