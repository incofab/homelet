<?php

namespace App\Services;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Conversation;
use App\Models\MaintenanceRequest;
use App\Models\Message;
use App\Models\Payment;
use App\Models\RentalRequest;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Faker\Generator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class DemoDataSeeder
{
    public function __construct(private LeaseService $leaseService)
    {
    }

    public function seed(array $options = []): array
    {
        $options = array_merge($this->defaults(), $this->normalizeOptions($options));
        $faker = app(Generator::class);

        app(RbacSeeder::class)->run();

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $tenantRole = Role::firstOrCreate(['name' => 'tenant']);

        $summary = [
            'buildings' => 0,
            'apartments' => 0,
            'leases' => 0,
            'payments' => 0,
            'maintenance_requests' => 0,
            'rental_requests' => 0,
            'conversations' => 0,
            'messages' => 0,
            'reviews' => 0,
            'users' => 0,
        ];

        for ($i = 0; $i < $options['buildings']; $i++) {
            $owner = User::factory()->create();
            $summary['users']++;
            $owner->roles()->syncWithoutDetaching([$adminRole->id]);

            $forSale = $faker->boolean(20);

            $building = Building::factory()->create([
                'owner_id' => $owner->id,
                'for_sale' => $forSale,
                'sale_price' => $forSale ? $faker->numberBetween(50_000_000, 500_000_000) : null,
            ]);

            $summary['buildings']++;

            $managers = collect();
            if ($options['managers_per_building'] > 0) {
                $managers = User::factory()->count($options['managers_per_building'])->create();
                $summary['users'] += $managers->count();

                foreach ($managers as $manager) {
                    $manager->roles()->syncWithoutDetaching([$managerRole->id]);
                    $building->users()->syncWithoutDetaching([
                        $manager->id => ['role_in_building' => 'manager'],
                    ]);
                }
            }

            $apartmentsPerBuilding = $options['apartments_per_building'];
            $occupiedCount = min($options['tenants_per_building'], $apartmentsPerBuilding);
            $vacantCount = max(0, $apartmentsPerBuilding - $occupiedCount);

            $occupiedApartments = Apartment::factory()
                ->count($occupiedCount)
                ->create([
                    'building_id' => $building->id,
                    'status' => 'vacant',
                    'is_public' => false,
                ]);

            $vacantApartments = Apartment::factory()
                ->count($vacantCount)
                ->create([
                    'building_id' => $building->id,
                    'status' => 'vacant',
                    'is_public' => true,
                ]);

            $summary['apartments'] += $occupiedApartments->count() + $vacantApartments->count();

            $tenants = collect();
            $leases = collect();
            $tenantApartments = [];

            foreach ($occupiedApartments as $apartment) {
                $tenant = User::factory()->create();
                $summary['users']++;

                $tenant->roles()->syncWithoutDetaching([$tenantRole->id]);
                $apartment->tenants()->syncWithoutDetaching([$tenant->id]);

                $startDate = Carbon::now()->subDays($faker->numberBetween(0, 30));

                $lease = $this->leaseService->create([
                    'apartment_id' => $apartment->id,
                    'tenant_id' => $tenant->id,
                    'rent_amount' => $apartment->yearly_price,
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $startDate->copy()->addYear()->toDateString(),
                    'status' => 'active',
                ]);

                $apartment->update([
                    'status' => 'occupied',
                    'is_public' => false,
                ]);

                $tenants->push($tenant);
                $leases->push($lease);
                $tenantApartments[$tenant->id] = $apartment;
                $summary['leases']++;

                for ($p = 0; $p < $options['payments_per_lease']; $p++) {
                    $method = $faker->randomElement(['manual', 'online']);

                    Payment::factory()->create([
                        'lease_id' => $lease->id,
                        'tenant_id' => $tenant->id,
                        'payment_method' => $method,
                        'transaction_reference' => $method === 'online' ? Str::upper(Str::random(12)) : null,
                        'status' => 'paid',
                        'payment_date' => Carbon::now()->subDays($faker->numberBetween(0, 30))->toDateString(),
                    ]);

                    $summary['payments']++;
                }

                for ($m = 0; $m < $options['maintenance_per_tenant']; $m++) {
                    MaintenanceRequest::factory()->create([
                        'apartment_id' => $apartment->id,
                        'tenant_id' => $tenant->id,
                    ]);

                    $summary['maintenance_requests']++;
                }
            }

            if ($options['rental_requests_per_building'] > 0 && $vacantApartments->isNotEmpty()) {
                $vacantApartments
                    ->take($options['rental_requests_per_building'])
                    ->each(function (Apartment $apartment) use (&$summary) {
                        RentalRequest::factory()->create([
                            'apartment_id' => $apartment->id,
                            'status' => 'new',
                        ]);

                        $summary['rental_requests']++;
                    });
            }

            if ($options['conversations_per_building'] > 0 && $tenants->isNotEmpty()) {
                $staff = $managers->first() ?? $owner;
                $tenantList = $tenants->values();

                for ($c = 0; $c < $options['conversations_per_building']; $c++) {
                    $tenant = $tenantList->random();
                    $apartment = $tenantApartments[$tenant->id] ?? null;

                    if (! $apartment) {
                        continue;
                    }

                    $conversation = Conversation::query()->create([
                        'building_id' => $building->id,
                        'apartment_id' => $apartment->id,
                        'created_by' => $staff->id,
                    ]);

                    $conversation->participants()->sync([$tenant->id, $staff->id]);

                    $summary['conversations']++;

                    $participants = collect([$tenant, $staff])->values();

                    for ($m = 0; $m < $options['messages_per_conversation']; $m++) {
                        $sender = $participants[$m % $participants->count()];

                        Message::factory()->create([
                            'conversation_id' => $conversation->id,
                            'sender_id' => $sender->id,
                        ]);

                        $summary['messages']++;
                    }
                }
            }

            if ($options['building_reviews'] > 0 && $tenants->isNotEmpty()) {
                for ($r = 0; $r < $options['building_reviews']; $r++) {
                    $tenant = $tenants->random();

                    $building->reviews()->create([
                        'user_id' => $tenant->id,
                        'rating' => $faker->numberBetween(3, 5),
                        'comment' => $faker->sentence,
                        'verified' => true,
                    ]);

                    $summary['reviews']++;
                }
            }

            if ($options['apartment_reviews'] > 0 && $leases->isNotEmpty()) {
                for ($r = 0; $r < $options['apartment_reviews']; $r++) {
                    $lease = $leases->random();

                    Review::query()->create([
                        'user_id' => $lease->tenant_id,
                        'reviewable_id' => $lease->apartment_id,
                        'reviewable_type' => Apartment::class,
                        'rating' => $faker->numberBetween(3, 5),
                        'comment' => $faker->sentence,
                        'verified' => true,
                    ]);

                    $summary['reviews']++;
                }
            }
        }

        return $summary;
    }

    private function defaults(): array
    {
        return [
            'buildings' => 2,
            'apartments_per_building' => 6,
            'managers_per_building' => 1,
            'tenants_per_building' => 3,
            'payments_per_lease' => 2,
            'maintenance_per_tenant' => 1,
            'conversations_per_building' => 1,
            'messages_per_conversation' => 3,
            'rental_requests_per_building' => 2,
            'building_reviews' => 2,
            'apartment_reviews' => 2,
        ];
    }

    private function normalizeOptions(array $options): array
    {
        $normalized = [];

        foreach ($options as $key => $value) {
            $normalized[$key] = max(0, (int) $value);
        }

        return $normalized;
    }
}
