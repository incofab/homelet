<?php

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

test('admin can upload building media and list it', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());

    $building = Building::factory()->create(['owner_id' => $owner->id]);

    Sanctum::actingAs($admin);
    $response = $this->postJson("/api/buildings/{$building->id}/media", [
        'file' => UploadedFile::fake()->image('building.jpg'),
        'collection' => 'images',
    ]);

    $response->assertStatus(201);
    expect(Media::count())->toBe(1);

    $listResponse = $this->getJson("/api/buildings/{$building->id}/media");
    $listResponse->assertStatus(200)
        ->assertJsonCount(1, 'data.media.data')
        ->assertJsonPath('data.media.data.0.id', $response->json('data.media.id'));
});

test('building media keeps the first uploaded image first for cover usage', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    Sanctum::actingAs($admin);

    $firstUpload = $this->postJson("/api/buildings/{$building->id}/media", [
        'file' => UploadedFile::fake()->image('cover.jpg'),
        'collection' => 'images',
    ])->assertCreated();

    $secondUpload = $this->postJson("/api/buildings/{$building->id}/media", [
        'file' => UploadedFile::fake()->image('gallery.jpg'),
        'collection' => 'images',
    ])->assertCreated();

    $this->getJson("/api/buildings/{$building->id}/media")
        ->assertOk()
        ->assertJsonPath('data.media.data.0.id', $firstUpload->json('data.media.id'))
        ->assertJsonPath('data.media.data.1.id', $secondUpload->json('data.media.id'));

    $this->getJson("/api/buildings/{$building->id}")
        ->assertOk()
        ->assertJsonPath('data.building.media.0.id', $firstUpload->json('data.media.id'))
        ->assertJsonPath('data.building.media.1.id', $secondUpload->json('data.media.id'));
});

test('admin can delete building media', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $owner = User::factory()->create();
    $admin = assignPlatformAdmin(User::factory()->create());
    $building = Building::factory()->create(['owner_id' => $owner->id]);

    Sanctum::actingAs($admin);
    $uploadResponse = $this->postJson("/api/buildings/{$building->id}/media", [
        'file' => UploadedFile::fake()->image('building.jpg'),
        'collection' => 'images',
    ]);

    $mediaId = $uploadResponse->json('data.media.id');

    $deleteResponse = $this->deleteJson("/api/buildings/{$building->id}/media/{$mediaId}");

    $deleteResponse->assertStatus(200);
    expect(Media::count())->toBe(0);
});

test('admin can delete apartment media', function () {
    Storage::fake('public');
    config(['filesystems.default' => 'public']);

    $admin = assignPlatformAdmin(User::factory()->create());
    $apartment = Apartment::factory()->create();

    Sanctum::actingAs($admin);
    $uploadResponse = $this->postJson("/api/apartments/{$apartment->id}/media", [
        'file' => UploadedFile::fake()->image('apartment.jpg'),
        'collection' => 'images',
    ]);

    $mediaId = $uploadResponse->json('data.media.id');

    $deleteResponse = $this->deleteJson("/api/apartments/{$apartment->id}/media/{$mediaId}");

    $deleteResponse->assertStatus(200);
    expect(Media::count())->toBe(0);
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
