<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Media;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('admin can upload building media and list it', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $owner = User::factory()->create();
    $admin = User::factory()->create();

    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $building->users()->attach($admin->id, ['role_in_building' => 'admin']);

    Sanctum::actingAs($admin);
    $response = $this->postJson("/api/buildings/{$building->id}/media", [
        'file' => UploadedFile::fake()->image('building.jpg'),
        'collection' => 'images',
    ]);

    $response->assertStatus(201);
    expect(Media::count())->toBe(1);

    $listResponse = $this->getJson("/api/buildings/{$building->id}/media");
    $listResponse->assertStatus(200)->assertJsonCount(1, 'data.media');
});

test('tenant cannot upload building media', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $tenant = User::factory()->create();
    $building = Building::factory()->create();

    Sanctum::actingAs($tenant);
    $response = $this->postJson("/api/buildings/{$building->id}/media", [
        'file' => UploadedFile::fake()->image('building.jpg'),
        'collection' => 'images',
    ]);

    $response->assertStatus(403);
});

test('tenant can upload maintenance request media for own request', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $tenant = User::factory()->create();
    $tenantRole = Role::firstOrCreate(['name' => 'tenant']);
    $tenant->roles()->syncWithoutDetaching([$tenantRole->id]);

    $apartment = Apartment::factory()->create();
    Lease::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $maintenanceRequest = MaintenanceRequest::factory()->create([
        'apartment_id' => $apartment->id,
        'tenant_id' => $tenant->id,
    ]);

    Sanctum::actingAs($tenant);
    $response = $this->postJson("/api/maintenance-requests/{$maintenanceRequest->id}/media", [
        'file' => UploadedFile::fake()->image('issue.jpg'),
        'collection' => 'images',
    ]);

    $response->assertStatus(201);
    expect($maintenanceRequest->media()->count())->toBe(1);
});

test('user can upload profile photo and replace existing', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/profile/media', [
        'file' => UploadedFile::fake()->image('avatar.jpg'),
        'collection' => 'profile',
    ]);

    $response->assertStatus(201);
    expect(Media::where('collection', 'profile')->count())->toBe(1);

    $response = $this->postJson('/api/profile/media', [
        'file' => UploadedFile::fake()->image('avatar2.jpg'),
        'collection' => 'profile',
    ]);

    $response->assertStatus(201);
    expect(Media::where('collection', 'profile')->count())->toBe(1);
});
