<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Building\ApproveBuildingRegistrationRequest;
use App\Http\Requests\Building\RejectBuildingRegistrationRequest;
use App\Mail\BuildingRegistrationApprovedMail;
use App\Mail\BuildingRegistrationRejectedMail;
use App\Models\Building;
use App\Models\BuildingRegistrationRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class BuildingRegistrationRequestController extends Controller
{
    public function index(): JsonResponse
    {
        $this->ensureAdmin();

        $status = request()->string('status')->toString();

        $query = BuildingRegistrationRequest::query()->latest('id');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $requests = paginateFromRequest($query);

        return $this->success('Building registration requests loaded.', [
            'requests' => $requests,
        ]);
    }

    public function show(BuildingRegistrationRequest $buildingRegistrationRequest): JsonResponse
    {
        $this->ensureAdmin();

        return $this->success('Building registration request loaded.', [
            'request' => $buildingRegistrationRequest,
        ]);
    }

    public function approve(
        ApproveBuildingRegistrationRequest $request,
        BuildingRegistrationRequest $buildingRegistrationRequest
    ): JsonResponse {
        $admin = $this->ensureAdmin();

        if ($buildingRegistrationRequest->status !== BuildingRegistrationRequest::STATUS_PENDING) {
            return $this->error('Only pending requests can be approved.', 422);
        }

        $owner = null;
        $building = null;

        DB::transaction(function () use ($buildingRegistrationRequest, $admin, &$owner, &$building): void {
            $owner = $buildingRegistrationRequest->user;

            if (! $owner) {
                $owner = User::where('email', $buildingRegistrationRequest->owner_email)->first();

                if (! $owner) {
                    $owner = User::create([
                        'name' => $buildingRegistrationRequest->owner_name,
                        'email' => $buildingRegistrationRequest->owner_email,
                        'phone' => $buildingRegistrationRequest->owner_phone,
                        'password' => $buildingRegistrationRequest->owner_password,
                    ]);
                }

                $owner->syncRoles([Role::findOrCreate(User::ROLE_USER)]);
                $buildingRegistrationRequest->user()->associate($owner);
            }

            $building = Building::create([
                'owner_id' => $owner->id,
                'name' => $buildingRegistrationRequest->name,
                'address_line1' => $buildingRegistrationRequest->address_line1,
                'address_line2' => $buildingRegistrationRequest->address_line2,
                'city' => $buildingRegistrationRequest->city,
                'state' => $buildingRegistrationRequest->state,
                'country' => $buildingRegistrationRequest->country,
                'description' => $buildingRegistrationRequest->description,
                'for_sale' => $buildingRegistrationRequest->for_sale,
                'sale_price' => $buildingRegistrationRequest->sale_price,
            ]);

            $buildingRegistrationRequest->building()->associate($building);
            $buildingRegistrationRequest->status = BuildingRegistrationRequest::STATUS_APPROVED;
            $buildingRegistrationRequest->approved_by = $admin->id;
            $buildingRegistrationRequest->approved_at = now();
            $buildingRegistrationRequest->save();
        });

        Mail::to($owner->email)->send(new BuildingRegistrationApprovedMail(
            $buildingRegistrationRequest->fresh(['building', 'user'])
        ));

        return $this->success('Building registration request approved.', [
            'request' => $buildingRegistrationRequest->refresh(),
            'building' => $building,
            'owner' => $owner,
        ]);
    }

    public function reject(
        RejectBuildingRegistrationRequest $request,
        BuildingRegistrationRequest $buildingRegistrationRequest
    ): JsonResponse {
        $admin = $this->ensureAdmin();

        if ($buildingRegistrationRequest->status !== BuildingRegistrationRequest::STATUS_PENDING) {
            return $this->error('Only pending requests can be rejected.', 422);
        }

        $buildingRegistrationRequest->update([
            'status' => BuildingRegistrationRequest::STATUS_REJECTED,
            'rejected_by' => $admin->id,
            'rejected_at' => now(),
            'rejection_reason' => $request->string('rejection_reason')->toString(),
        ]);

        $email = $buildingRegistrationRequest->user?->email
            ?? $buildingRegistrationRequest->owner_email;

        if ($email) {
            Mail::to($email)->send(new BuildingRegistrationRejectedMail(
                $buildingRegistrationRequest->fresh()
            ));
        }

        return $this->success('Building registration request rejected.', [
            'request' => $buildingRegistrationRequest->refresh(),
        ]);
    }

    private function ensureAdmin(): User
    {
        $user = request()->user('sanctum');

        if (! $user || ! $user->isPlatformAdmin()) {
            abort(403);
        }

        return $user;
    }

    private function error(string $message, int $status = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], $status);
    }
}
