<?php

namespace App\Http\Requests\Review;

use App\Http\Requests\ApiRequest;

class StoreReviewRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:2000'],
        ];
    }
}
