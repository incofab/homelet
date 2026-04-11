<?php

namespace App\Http\Requests\ExpenseCategory;

class UpdateExpenseCategoryRequest extends StoreExpenseCategoryRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'regex:/^#[A-Fa-f0-9]{6}$/'],
            'description' => ['nullable', 'string'],
        ];
    }
}
