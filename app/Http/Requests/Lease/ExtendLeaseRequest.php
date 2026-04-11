<?php

namespace App\Http\Requests\Lease;

use App\Http\Requests\ApiRequest;
use App\Models\Lease;
use Carbon\Carbon;
use Illuminate\Validation\Validator;

class ExtendLeaseRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_end_date' => ['nullable', 'date', 'required_without:duration_in_months'],
            'duration_in_months' => ['nullable', 'integer', 'min:1', 'required_without:new_end_date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->filled('new_end_date') && $this->filled('duration_in_months')) {
                $message = 'Provide either new_end_date or duration_in_months, not both.';

                $validator->errors()->add('new_end_date', $message);
                $validator->errors()->add('duration_in_months', $message);
            }

            /** @var Lease|null $lease */
            $lease = $this->route('lease');
            $currentEndDate = $lease?->end_date ? Carbon::parse($lease->end_date) : null;

            if ($currentEndDate && $this->filled('new_end_date')) {
                $newEndDate = Carbon::parse((string) $this->input('new_end_date'));

                if ($newEndDate->lte($currentEndDate)) {
                    $validator->errors()->add('new_end_date', 'The new end date must be after the current lease end date.');
                }
            }
        });
    }
}
