<?php

namespace App\Http\Requests\Apartment;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class StoreApartmentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $typeRule = Rule::in([
            'one_room',
            'self_contain',
            'one_bedroom',
            'two_bedroom',
            'three_bedroom',
            'custom',
        ]);
        $statusRule = Rule::in(['vacant', 'occupied', 'maintenance']);

        return [
            'apartments' => ['sometimes', 'array', 'min:1', 'max:50'],
            'apartments.*.unit_code' => ['required_with:apartments', 'string', 'max:255'],
            'apartments.*.type' => ['nullable', $typeRule],
            'apartments.*.yearly_price' => ['required_with:apartments', 'integer', 'min:0'],
            'apartments.*.description' => ['nullable', 'string'],
            'apartments.*.floor' => ['nullable', 'string', 'max:255'],
            'apartments.*.status' => ['nullable', $statusRule],
            'apartments.*.is_public' => ['nullable', 'boolean'],
            'apartments.*.amenities' => ['nullable', 'array'],
            'unit_code' => ['required_without:apartments', 'string', 'max:255'],
            'type' => ['nullable', $typeRule],
            'yearly_price' => ['required_without:apartments', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'floor' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', $statusRule],
            'is_public' => ['nullable', 'boolean'],
            'amenities' => ['nullable', 'array'],
        ];
    }

    public function apartmentPayloads(): array
    {
        $validated = $this->validated();
        $apartments = $validated['apartments'] ?? [
            collect($validated)->except('apartments')->all(),
        ];

        return collect($apartments)
            ->map(fn (array $apartment): array => [
                ...$apartment,
                'type' => $apartment['type'] ?? 'custom',
                'status' => $apartment['status'] ?? 'vacant',
                'is_public' => $apartment['is_public'] ?? true,
            ])
            ->all();
    }
}
