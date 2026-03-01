<?php

namespace App\Console\Commands;

use App\Jobs\SendRenewalReminderEmail;
use App\Models\Lease;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendRenewalReminderEmails extends Command
{
    protected $signature = 'leases:send-renewal-reminders';

    protected $description = 'Send renewal reminder emails 90 days before lease end date.';

    public function handle(): int
    {
        $targetDate = Carbon::today()->addDays(90)->toDateString();

        Lease::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', $targetDate)
            ->orderBy('id')
            ->chunkById(200, function ($leases): void {
                foreach ($leases as $lease) {
                    SendRenewalReminderEmail::dispatch($lease);
                }
            });

        return Command::SUCCESS;
    }
}
