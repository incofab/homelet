<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\ApiRequest;

class LoginRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $identifier = trim((string) $this->input('identifier'));

        $this->merge([
            'identifier' => str_contains($identifier, '@')
                ? mb_strtolower($identifier)
                : normalizePhoneNumber($identifier),
        ]);
    }
}
