<?php

namespace App\Http\Requests\RentalRequest;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class StoreRentalRequestPublicRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'apartment_id' => [
                'required',
                'integer',
                Rule::exists('apartments', 'id')->where(fn ($query) => $query->where('status', 'vacant')),
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'message' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'apartment_id.exists' => 'This apartment is no longer available.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->input('email'))),
            'phone' => $this->filled('phone') ? normalizePhoneNumber($this->input('phone')) : null,
        ]);
    }
}
