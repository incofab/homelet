<?php

namespace App\Http\Requests\Conversation;

use App\Http\Requests\ApiRequest;

class StoreConversationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'building_id' => ['nullable', 'integer', 'exists:buildings,id'],
            'apartment_id' => ['nullable', 'integer', 'exists:apartments,id'],
            'participant_ids' => ['nullable', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
