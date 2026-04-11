<?php

namespace App\Http\Requests\Lease;

use App\Http\Requests\ApiRequest;
use App\Models\Lease;
use Carbon\Carbon;
use Illuminate\Validation\Validator;

class RenewLeaseRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date'],
            'new_rent_amount' => ['nullable', 'integer', 'min:0'],
            'duration_in_months' => ['nullable', 'integer', 'min:1', 'required_without:end_date'],
            'end_date' => ['nullable', 'date', 'required_without:duration_in_months'],
            'record_payment' => ['nullable', 'boolean'],
            'payment_amount' => ['nullable', 'integer', 'min:0', 'required_if:record_payment,1,true'],
            'payment_date' => ['nullable', 'date', 'required_if:record_payment,1,true'],
            'payment_due_date' => ['nullable', 'date'],
            'payment_status' => ['nullable', 'in:pending,paid,failed'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->filled('end_date') && $this->filled('duration_in_months')) {
                $message = 'Provide either end_date or duration_in_months, not both.';

                $validator->errors()->add('end_date', $message);
                $validator->errors()->add('duration_in_months', $message);
            }

            /** @var Lease|null $lease */
            $lease = $this->route('lease');
            $currentEndDate = $lease?->end_date ? Carbon::parse($lease->end_date) : null;

            if (! $currentEndDate) {
                return;
            }

            $startDate = $this->filled('start_date')
                ? Carbon::parse((string) $this->input('start_date'))
                : $currentEndDate->copy()->addDay();

            if ($startDate->lte($currentEndDate)) {
                $validator->errors()->add('start_date', 'The renewal start date must be after the current lease end date.');
            }

            if ($this->filled('end_date')) {
                $endDate = Carbon::parse((string) $this->input('end_date'));

                if ($endDate->lte($startDate)) {
                    $validator->errors()->add('end_date', 'The renewal end date must be after the renewal start date.');
                }
            }
        });
    }
}
