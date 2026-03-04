<?php

namespace App\Console\Commands;

use App\Services\DemoDataSeeder;
use Illuminate\Console\Command;

class SeedDemoData extends Command
{
    protected $signature = 'demo:seed
        {--buildings=2 : Number of buildings to create}
        {--apartments=6 : Apartments per building}
        {--managers=1 : Managers per building}
        {--tenants=3 : Tenants per building}
        {--payments=2 : Payments per lease}
        {--maintenance=1 : Maintenance requests per tenant}
        {--conversations=1 : Conversations per building}
        {--messages=3 : Messages per conversation}
        {--rental-requests=2 : Rental requests per building}
        {--building-reviews=2 : Building reviews per building}
        {--apartment-reviews=2 : Apartment reviews per building}';

    protected $description = 'Seed connected demo data for manual testing.';

    public function handle(DemoDataSeeder $seeder): int
    {
        $summary = $seeder->seed([
            'buildings' => $this->option('buildings'),
            'apartments_per_building' => $this->option('apartments'),
            'managers_per_building' => $this->option('managers'),
            'tenants_per_building' => $this->option('tenants'),
            'payments_per_lease' => $this->option('payments'),
            'maintenance_per_tenant' => $this->option('maintenance'),
            'conversations_per_building' => $this->option('conversations'),
            'messages_per_conversation' => $this->option('messages'),
            'rental_requests_per_building' => $this->option('rental-requests'),
            'building_reviews' => $this->option('building-reviews'),
            'apartment_reviews' => $this->option('apartment-reviews'),
        ]);

        $this->info('Demo data seeded.');

        foreach ($summary as $key => $count) {
            $this->line(sprintf('  - %s: %d', str_replace('_', ' ', $key), $count));
        }

        return Command::SUCCESS;
    }
}
