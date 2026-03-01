<?php

namespace App\Http\Requests\Conversation;

use App\Http\Requests\ApiRequest;

class StoreMessageRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
        ];
    }
}
