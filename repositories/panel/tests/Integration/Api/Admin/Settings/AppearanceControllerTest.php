<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Admin\Settings\AppearanceControllerTest;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Tag;
use Pterodactyl\Services\Appearance\AppearanceSettings;
use Pterodactyl\Tests\Integration\Api\Admin\AdminApiIntegrationTestCase;

uses(AdminApiIntegrationTestCase::class);

test('appearance settings persist and reject invalid values', function (): void {
    $url = '/api/admin/settings/appearance';
    $payload = ['company_name' => 'Ibis Hosting', 'accent' => '#20c7dc', 'default_mode' => 'light', 'allow_user_override' => true, 'available_modes' => ['system', 'oled', 'light', 'legacy'], 'navigation_position' => 'left', 'roundness' => 35, 'storage_unit' => 'binary', 'default_language' => 'en', 'enabled_languages' => ['en', 'hi', 'es'], 'allow_language_override' => true, 'language_suggestions' => false, 'card_layout' => 'banner', 'glass' => true, 'banners_enabled' => false];
    $this->putJson($url, $payload)->assertOk()->assertJsonPath('card_layout', 'banner')->assertJsonPath('company_name', 'Ibis Hosting');
    $this->assertDatabaseHas('settings', ['key' => AppearanceSettings::PREFIX.'accent', 'value' => '#20c7dc']);
    $this->putJson($url, [...$payload, 'accent' => 'url(javascript:alert(1))'])->assertUnprocessable();
    $this->putJson($url, [...$payload, 'accent' => '#000000'])->assertUnprocessable();
    $this->putJson($url, [...$payload, 'company_name' => '   '])->assertUnprocessable();
    $this->putJson($url, [...$payload, 'card_layout' => 'unapproved'])->assertUnprocessable();
    $this->postJson($url.'/reset')->assertOk()->assertJsonPath('card_layout', 'premium');
});

test('image uploads are validated, scoped and restorable', function (): void {
    Storage::fake('public');
    $url = '/api/admin/settings/appearance/image';
    $this->getJson('/appearance/manifest.webmanifest')->assertOk()->assertJsonPath('icons.0.src', '/brand/ibis-icon-192.png');
    $this->post($url, ['slot' => 'favicon', 'image' => UploadedFile::fake()->create('code.svg', 1, 'image/svg+xml')], ['Accept' => 'application/json'])->assertUnprocessable();
    $this->post($url, ['slot' => 'favicon', 'image' => UploadedFile::fake()->image('wide.png', 3201, 20)], ['Accept' => 'application/json'])->assertUnprocessable();
    $this->post($url, ['slot' => 'favicon', 'image' => UploadedFile::fake()->image('rect.png', 128, 64)], ['Accept' => 'application/json'])->assertUnprocessable();
    $this->post($url, ['slot' => 'favicon', 'image' => UploadedFile::fake()->image('icon.png', 128, 128)], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('assets.favicon', fn ($url) => str_contains($url, '/appearance/'));
    $path = app(AppearanceSettings::class)->get('favicon');
    Storage::disk('public')->assertExists($path);
    $this->getJson('/appearance/manifest.webmanifest')->assertOk()->assertJsonPath('icons.0.sizes', '128x128');
    $this->deleteJson($url, ['slot' => 'favicon'])->assertOk()->assertJsonPath('assets.favicon', '/brand/ibis-icon-32.png');
    Storage::disk('public')->assertMissing($path);
});

test('server banners override egg and global banners and can be disabled', function (): void {
    Storage::fake('public');
    $server = Server::factory()->withRelationships()->create(['owner_id' => $this->getAdminUser()->id]);
    $url = '/api/admin/settings/appearance/image';
    foreach ([['global_banner', null], ['egg_banner', $server->egg_id], ['server_banner', $server->id]] as [$slot, $id]) {
        $this->post($url, ['slot' => $slot, 'target_id' => $id, 'image' => UploadedFile::fake()->image($slot.'.png', 600, 240)], ['Accept' => 'application/json'])->assertOk();
    }
    $appearance = app(AppearanceSettings::class);
    $this->assertSame(Storage::disk('public')->url($appearance->get('server_banner_'.$server->id)), $appearance->bannerFor($server));
    $this->deleteJson($url, ['slot' => 'server_banner', 'target_id' => $server->id])->assertOk();
    $this->assertSame(Storage::disk('public')->url($appearance->get('egg_banner_'.$server->egg_id)), $appearance->bannerFor($server));
    $this->deleteJson($url, ['slot' => 'egg_banner', 'target_id' => $server->egg_id])->assertOk();
    $this->assertSame(Storage::disk('public')->url($appearance->get('global_banner')), $appearance->bannerFor($server));
    $appearance->put('banners_enabled', '0');
    $this->assertNull($appearance->bannerFor($server));
});

test('built-in banners use egg workload tags and a neutral fallback', function (): void {
    $server = Server::factory()->withRelationships()->create(['owner_id' => $this->getAdminUser()->id]);
    $appearance = app(AppearanceSettings::class);
    $server->egg->tags()->detach();
    $server->egg->unsetRelation('tags');

    $this->assertSame('/brand/banners/generic-server.webp', $appearance->bannerFor($server));

    foreach (['minecraft', 'hytale', 'fivem', 'discord-bot', 'nodejs', 'web-app', 'python-app'] as $workload) {
        $tag = Tag::findOrCreateFromSlugs([$workload])->first();
        $server->egg->tags()->sync([$tag->id]);
        $server->egg->unsetRelation('tags');
        $this->assertSame('/brand/banners/'.$workload.'.webp', $appearance->bannerFor($server));
        $this->assertFileExists(public_path('brand/banners/'.$workload.'.webp'));
    }
});

test('workload artwork honors specific uploads, category defaults and generic fallback', function (): void {
    Storage::fake('public');
    $server = Server::factory()->withRelationships()->create(['owner_id' => $this->getAdminUser()->id]);
    $appearance = app(AppearanceSettings::class);
    $server->egg->tags()->detach();
    $server->egg->unsetRelation('tags');
    $this->assertSame('/brand/workloads/generic-server.svg', $appearance->iconFor($server));

    $minecraft = Tag::findOrCreateFromSlugs(['minecraft'])->first();
    $server->egg->tags()->sync([$minecraft->id]);
    $server->egg->unsetRelation('tags');
    $this->assertSame('/brand/workloads/minecraft.svg', $appearance->iconFor($server));
    $this->assertSame('/brand/banners/minecraft.webp', $appearance->bannerFor($server));

    $url = '/api/admin/settings/appearance/image';
    foreach ([['egg_icon', $server->egg_id], ['server_icon', $server->id]] as [$slot, $id]) {
        $this->post($url, ['slot' => $slot, 'target_id' => $id, 'image' => UploadedFile::fake()->image($slot.'.png', 128, 128)], ['Accept' => 'application/json'])->assertOk();
    }
    $this->assertSame(Storage::disk('public')->url($appearance->get('server_icon_'.$server->id)), $appearance->iconFor($server));
    $this->deleteJson($url, ['slot' => 'server_icon', 'target_id' => $server->id])->assertOk();
    $this->assertSame(Storage::disk('public')->url($appearance->get('egg_icon_'.$server->egg_id)), $appearance->iconFor($server));
    $this->deleteJson($url, ['slot' => 'egg_icon', 'target_id' => $server->egg_id])->assertOk();
    $this->assertSame('/brand/workloads/minecraft.svg', $appearance->iconFor($server));
    $this->post($url, ['slot' => 'server_icon', 'target_id' => $server->id, 'image' => UploadedFile::fake()->image('wide.png', 128, 64)], ['Accept' => 'application/json'])->assertUnprocessable();
});

test('workload imagery follows Egg tags and capabilities rather than server names', function (): void {
    $server = Server::factory()->withRelationships()->create(['owner_id' => $this->getAdminUser()->id, 'name' => 'An unrelated name']);
    $artwork = app(\Pterodactyl\Services\Appearance\WorkloadArtwork::class);
    foreach ([
        'minecraft' => 'minecraft',
        'discord-bot' => 'discord-bot',
        'nodejs' => 'nodejs',
        'static-website' => 'static-website',
        'web-app' => 'web-app',
        'fivem' => 'fivem',
        'hytale' => 'hytale',
        'python-app' => 'python-app',
    ] as $tagSlug => $category) {
        $tag = Tag::findOrCreateFromSlugs([$tagSlug])->first();
        $server->egg->tags()->sync([$tag->id]);
        $server->egg->unsetRelation('tags');
        $this->assertSame($category, $artwork->category($server));
        $this->assertFileExists(public_path(ltrim($artwork->icon($category), '/')));
        $this->assertFileExists(public_path(ltrim($artwork->banner($category), '/')));
    }
    $bedrock = Tag::findOrCreateFromSlugs(['minecraft', 'bedrock']);
    $server->egg->tags()->sync($bedrock->pluck('id'));
    $server->egg->unsetRelation('tags');
    $this->assertSame('minecraft-bedrock', $artwork->category($server));
    $this->assertSame('/brand/banners/minecraft.webp', $artwork->banner('minecraft-bedrock'));
});

test('non administrators cannot change appearance or upload images', function (): void {
    $this->actingAsNonAdmin();
    $this->getJson('/api/admin/settings/appearance')->assertForbidden();
    $this->putJson('/api/admin/settings/appearance', [])->assertForbidden();
    $this->postJson('/api/admin/settings/appearance/image', [])->assertForbidden();
});

test('appearance choice respects the provider default, legacy cookie and allowed modes', function (): void {
    $appearance = app(AppearanceSettings::class);
    $request = fn (array $cookies = []) => Request::create('/', 'GET', [], $cookies);
    $this->assertSame('legacy', $appearance->mode($request()));
    $this->assertSame('light', $appearance->mode($request(['pterodactyl_scheme' => 'light'])));
    $this->assertSame('oled', $appearance->mode($request(['ibis_appearance' => 'oled'])));
    $appearance->put('available_modes', 'system,light,legacy');
    $this->assertSame('legacy', $appearance->mode($request(['ibis_appearance' => 'oled'])));
    $appearance->put('allow_user_override', '0');
    $this->assertSame('legacy', $appearance->mode($request(['ibis_appearance' => 'light'])));
});
