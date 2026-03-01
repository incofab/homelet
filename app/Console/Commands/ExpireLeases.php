<?php

namespace App\Console\Commands;

use App\Models\Lease;
use App\Jobs\SendQuitNoticeEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ExpireLeases extends Command
{
    protected $signature = 'leases:expire';

    protected $description = 'Expire leases that ended before today and update apartment status.';

    public function handle(): int
    {
        $today = Carbon::today();

        Lease::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', $today)
            ->orderBy('id')
            ->chunkById(200, function ($leases): void {
                foreach ($leases as $lease) {
                    DB::transaction(function () use ($lease): void {
                        $lease->status = 'expired';
                        $lease->save();

                        $hasOtherActive = Lease::query()
                            ->where('apartment_id', $lease->apartment_id)
                            ->where('status', 'active')
                            ->whereKeyNot($lease->id)
                            ->exists();

                        if (! $hasOtherActive && $lease->apartment) {
                            $lease->apartment->update([
                                'status' => 'vacant',
                                'is_public' => true,
                            ]);

                            SendQuitNoticeEmail::dispatch($lease);
                        }
                    });
                }
            });

        return Command::SUCCESS;
    }
}
