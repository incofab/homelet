<?php

namespace App\Services;

use App\Contracts\SendsSms;
use Illuminate\Support\Facades\Log;

class LogSmsService implements SendsSms
{
    public function send(string $phoneNumber, string $message): void
    {
        Log::info('SMS notification queued.', [
            'phone' => $phoneNumber,
            'message' => $message,
        ]);
    }
}
