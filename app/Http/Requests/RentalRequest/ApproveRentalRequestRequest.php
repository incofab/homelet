<?php

namespace App\Http\Requests\RentalRequest;

use App\Http\Requests\ApiRequest;

class ApproveRentalRequestRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'apartment_id' => ['nullable', 'integer', 'exists:apartments,id'],
            'start_date' => ['required', 'date'],
            'rent_amount' => ['nullable', 'integer', 'min:0'],
            'record_payment' => ['nullable', 'boolean'],
            'payment_amount' => ['nullable', 'integer', 'min:0', 'required_if:record_payment,1,true'],
            'payment_date' => ['nullable', 'date', 'required_if:record_payment,1,true'],
            'payment_due_date' => ['nullable', 'date'],
            'payment_status' => ['nullable', 'in:pending,paid,failed'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
