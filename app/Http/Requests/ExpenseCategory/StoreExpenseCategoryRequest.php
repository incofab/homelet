<?php

namespace App\Http\Requests\ExpenseCategory;

use App\Http\Requests\ApiRequest;

class StoreExpenseCategoryRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'regex:/^#[A-Fa-f0-9]{6}$/'],
            'description' => ['nullable', 'string'],
        ];
    }
}
