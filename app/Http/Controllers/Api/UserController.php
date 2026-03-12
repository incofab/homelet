<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user('sanctum');

        if (! $actor || ! $actor->isPlatformAdmin()) {
            abort(403);
        }

        $search = trim($request->string('q')->toString());

        $users = paginateFromRequest(
            User::query()
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($searchQuery) use ($search) {
                        $searchQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->latest('id')
        );

        return $this->success('Users loaded.', [
            'users' => $users,
        ]);
    }

    public function impersonate(Request $request, User $user): JsonResponse
    {
        $actor = $request->user('sanctum');

        if (! $actor || ! $actor->isPlatformAdmin()) {
            abort(403);
        }

        if ($actor->is($user) || $user->isPlatformAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Impersonation is only allowed for other non-admin users.',
                'data' => null,
                'errors' => [
                    'user' => ['Impersonation is only allowed for other non-admin users.'],
                ],
            ], 422);
        }

        $token = $user->createToken(
            sprintf('impersonation:%d:%d', $actor->id, $user->id),
            ['impersonated', 'impersonator:'.$actor->id]
        )->plainTextToken;

        return $this->success('Impersonation started.', [
            'user' => $user,
            'dashboard' => $user->dashboard,
            'dashboard_context' => $user->dashboardContext(),
            'token' => $token,
            'impersonation' => [
                'impersonator' => [
                    'id' => $actor->id,
                    'name' => $actor->name,
                ],
                'impersonated_user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ],
            ],
        ]);
    }
}
