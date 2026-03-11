<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'phone' => $request->string('phone')->toString() ?: null,
            'password' => $request->string('password')->toString(),
        ]);

        $token = $user->createToken($request->string('device_name', 'api')->toString())->plainTextToken;

        return $this->success('Registration successful.', [
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->string('email')->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return $this->error('Invalid credentials.', [
                'email' => ['The provided credentials are incorrect.'],
            ], 422);
        }

        $token = $user->createToken($request->string('device_name', 'api')->toString())->plainTextToken;

        return $this->success('Login successful.', [
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->success('Logout successful.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success('Profile loaded.', [
            'user' => $request->user()->load('profileMedia'),
        ]);
    }

    private function error(string $message, mixed $errors = null, int $status = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $status);
    }
}
