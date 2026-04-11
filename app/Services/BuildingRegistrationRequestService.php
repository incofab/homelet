<?php

namespace App\Services;

use App\Mail\BuildingRegistrationApprovedMail;
use App\Mail\BuildingRegistrationRejectedMail;
use App\Models\Building;
use App\Models\BuildingRegistrationRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class BuildingRegistrationRequestService
{
    public function submit(User $user, array $payload): BuildingRegistrationRequest
    {
        return BuildingRegistrationRequest::create([
            'status' => BuildingRegistrationRequest::STATUS_PENDING,
            'user_id' => $user->id,
            'name' => $payload['name'],
            'address_line1' => $payload['address_line1'],
            'address_line2' => $payload['address_line2'] ?? null,
            'city' => $payload['city'],
            'state' => $payload['state'],
            'country' => $payload['country'],
            'description' => $payload['description'] ?? null,
            'for_sale' => $payload['for_sale'] ?? false,
            'sale_price' => $payload['sale_price'] ?? null,
            'owner_name' => $user->name,
            'owner_email' => $user->email,
            'owner_phone' => $user->phone,
        ]);
    }

    public function approve(BuildingRegistrationRequest $request, User $admin): array
    {
        $owner = null;
        $building = null;

        DB::transaction(function () use ($request, $admin, &$owner, &$building): void {
            $owner = $request->user ?? $this->resolveOwner($request);

            if (! $request->user) {
                $request->user()->associate($owner);
            }

            $building = Building::create([
                'owner_id' => $owner->id,
                'name' => $request->name,
                'address_line1' => $request->address_line1,
                'address_line2' => $request->address_line2,
                'city' => $request->city,
                'state' => $request->state,
                'country' => $request->country,
                'description' => $request->description,
                'for_sale' => $request->for_sale,
                'sale_price' => $request->sale_price,
            ]);

            $request->building()->associate($building);
            $request->status = BuildingRegistrationRequest::STATUS_APPROVED;
            $request->approved_by = $admin->id;
            $request->approved_at = now();
            $request->save();
        });

        if ($owner->email) {
            Mail::to($owner->email)->send(new BuildingRegistrationApprovedMail(
                $request->fresh(['building', 'user'])
            ));
        }

        return [
            'request' => $request->refresh(),
            'building' => $building,
            'owner' => $owner,
        ];
    }

    public function reject(BuildingRegistrationRequest $request, User $admin, string $reason): BuildingRegistrationRequest
    {
        $request->update([
            'status' => BuildingRegistrationRequest::STATUS_REJECTED,
            'rejected_by' => $admin->id,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $email = $request->user?->email ?? $request->owner_email;

        if ($email) {
            Mail::to($email)->send(new BuildingRegistrationRejectedMail(
                $request->fresh()
            ));
        }

        return $request->refresh();
    }

    private function resolveOwner(BuildingRegistrationRequest $request): User
    {
        $owner = User::query()
            ->where('phone', $request->owner_phone)
            ->when(
                $request->owner_email,
                fn ($query) => $query->orWhere('email', $request->owner_email)
            )
            ->first();

        if (! $owner) {
            $owner = User::create([
                'name' => $request->owner_name,
                'email' => $request->owner_email,
                'phone' => $request->owner_phone,
                'password' => $request->owner_password,
            ]);
        }

        $owner->syncRoles([Role::findOrCreate(User::ROLE_USER)]);

        return $owner;
    }
}
