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
}
