<?php

namespace App\Jobs;

use App\Mail\RenewalReminderMail;
use App\Models\Lease;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendRenewalReminderEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Lease $lease)
    {
    }

    public function handle(): void
    {
        $tenant = $this->lease->tenant;

        if (! $tenant || ! $tenant->email) {
            return;
        }

        Mail::to($tenant->email)->send(new RenewalReminderMail($this->lease));
    }
}
