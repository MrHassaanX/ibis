<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Admin\MilestoneBFeaturesTest;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Setting;
use Pterodactyl\Tests\Integration\Api\Admin\AdminApiIntegrationTestCase;

uses(AdminApiIntegrationTestCase::class);

test('region fields persist through location update and are returned to administrators', function (): void {
    $location = Location::factory()->create();

    $this->putJson("/api/admin/locations/{$location->id}", ['short' => $location->short, 'region_visible' => true])->assertUnprocessable();

    $this->putJson("/api/admin/locations/{$location->id}", [
        'short' => $location->short,
        'long' => $location->long,
        'country_code' => 'DE',
        'region_name' => 'Bavaria',
        'display_label' => 'Munich',
        'region_visible' => true,
    ])->assertOk()->assertJsonPath('attributes.country_code', 'DE')->assertJsonPath('attributes.region_visible', true);

    $this->assertDatabaseHas('locations', ['id' => $location->id, 'country_code' => 'DE', 'region_name' => 'Bavaria', 'display_label' => 'Munich', 'region_visible' => true]);
    $this->putJson("/api/admin/locations/{$location->id}", ['short' => $location->short, 'country_code' => 'DE', 'region_visible' => false])->assertOk();
    $this->getJson("/api/admin/locations/{$location->id}")->assertJsonPath('attributes.region_visible', false);
});

test('visible regions appear on both server list and information responses', function (): void {
    $server = Server::factory()->withRelationships()->create(['owner_id' => $this->getAdminUser()->id]);
    $server->node->location->update(['country_code' => 'DE', 'region_name' => 'Bavaria', 'display_label' => 'Munich', 'region_visible' => true]);

    $this->getJson('/api/client')->assertOk()->assertJsonPath('data.0.attributes.region.country_code', 'DE')->assertJsonPath('data.0.attributes.region.label', 'Munich');
    $this->getJson("/api/client/servers/{$server->uuid}")->assertOk()->assertJsonPath('attributes.region.name', 'Bavaria');

    $server->node->location->update(['region_visible' => false]);
    $this->getJson('/api/client')->assertJsonPath('data.0.attributes.region', null);
});

test('announcements support publication, scheduling, dismissal, editing and deletion', function (): void {
    $payload = ['title' => 'Maintenance', 'body' => '<script>alert(1)</script> Planned work', 'type' => 'warning', 'published' => false, 'dismissible' => true];

    $id = $this->postJson('/api/admin/announcements', $payload)->assertCreated()->json('id');
    $this->getJson('/api/client/announcements')->assertOk()->assertJsonCount(0);

    $this->putJson("/api/admin/announcements/$id", [...$payload, 'published' => true, 'starts_at' => now()->addDay()->toIso8601String()])->assertOk();
    $this->getJson('/api/client/announcements')->assertJsonCount(0);

    $this->putJson("/api/admin/announcements/$id", [...$payload, 'published' => true, 'starts_at' => null, 'expires_at' => now()->addDay()->toIso8601String()])->assertOk();
    $this->getJson('/api/client/announcements')->assertJsonCount(1)->assertJsonPath('0.body', $payload['body']);
    $this->travel(2)->days();
    $this->getJson('/api/client/announcements')->assertJsonCount(0);
    $this->travelBack();
    $this->postJson("/api/client/announcements/$id/dismiss")->assertNoContent();
    $this->getJson('/api/client/announcements')->assertJsonCount(0);
    $this->putJson("/api/admin/announcements/$id", [...$payload, 'body' => 'Revised notice', 'published' => true, 'starts_at' => null, 'expires_at' => now()->addDay()->toIso8601String()])->assertOk();
    $this->getJson('/api/client/announcements')->assertJsonCount(1)->assertJsonPath('0.body', 'Revised notice');

    $this->deleteJson("/api/admin/announcements/$id")->assertNoContent();
    $this->assertDatabaseMissing('announcements', ['id' => $id]);
});

test('announcement and loader administration reject non administrators', function (): void {
    $this->actingAsNonAdmin();

    $this->postJson('/api/admin/announcements', ['title' => 'Unauthorized'])->assertForbidden();
    $this->getJson('/api/admin/settings/loader')->assertForbidden();
});

test('loader validates images and resets its stored setting', function (): void {
    Storage::fake('public');

    $this->postJson('/api/admin/settings/loader', ['image' => UploadedFile::fake()->create('bad.txt', 3, 'text/plain')])->assertUnprocessable();
    $this->postJson('/api/admin/settings/loader', ['image' => UploadedFile::fake()->image('too-wide.png', 1201, 100)])->assertUnprocessable();
    $this->postJson('/api/admin/settings/loader', ['image' => UploadedFile::fake()->image('loader.png', 256, 256)])->assertOk()->assertJsonPath('url', fn ($value) => str_contains($value, '/loaders/'));
    expect(Setting::fetch('settings::ibispanel:loader'))->not->toBeEmpty();
    $this->deleteJson('/api/admin/settings/loader')->assertOk()->assertJsonPath('url', null);
    expect(Setting::fetch('settings::ibispanel:loader'))->toBe('');
});
