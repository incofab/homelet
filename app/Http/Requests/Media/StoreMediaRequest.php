<?php

namespace App\Http\Requests\Media;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class StoreMediaRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:51200', 'mimes:jpg,jpeg,png,webp,mp4,mov'],
            'collection' => ['nullable', Rule::in(['images', 'videos', 'profile'])],
        ];
    }
}
