<?php

namespace App\Contracts;

interface SendsSms
{
    public function send(string $phoneNumber, string $message): void;
}
