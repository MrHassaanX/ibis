<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Client\Server\MinecraftPropertiesTest;

use Pterodactyl\Enum\Permissions;
use Pterodactyl\Models\Tag;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;
use Pterodactyl\Tests\Support\Fakes\FakeDaemonFile;

uses(ClientApiIntegrationTestCase::class);

const PROPERTIES_ENTRY = ['name' => 'server.properties', 'mode' => '-rw-r--r--', 'mode_bits' => '0644', 'size' => 32, 'file' => true, 'symlink' => false, 'mime' => 'text/plain', 'created' => '2024-01-01T00:00:00Z', 'modified' => '2024-01-01T00:00:00Z'];

function compatible($server): void
{
    $server->egg->tags()->syncWithoutDetaching([Tag::query()->firstOrCreate(['slug' => 'minecraft'], ['name' => 'Minecraft'])->id]);
    $server->egg->update([
        'features' => ['minecraft.java', 'minecraft.properties'],
        'config_files' => json_encode(['server.properties' => ['parser' => 'properties', 'find' => []]]),
    ]);
}

test('authorized user reads and updates the configured file with a matching revision', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileReadContent->value, Permissions::FileUpdate->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [PROPERTIES_ENTRY];
    $fake->content = "motd=Old\ncustom=value\n";
    $url = $this->link($server, '/properties');
    $this->actingAs($user)->getJson($url)->assertOk()->assertJsonPath('path', '/server.properties')
        ->assertJsonPath('hash', hash('sha256', $fake->content));
    $this->actingAs($user)->putJson($url, ['content' => "motd=New\ncustom=value\n", 'original_hash' => hash('sha256', $fake->content)])
        ->assertOk()->assertJsonPath('hash', hash('sha256', "motd=New\ncustom=value\n"));
    $fake->assertContentFetched('/server.properties');
    $fake->assertContentPut('/server.properties', "motd=New\ncustom=value\n");
});

test('stale revision cannot overwrite a changed file', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileUpdate->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [PROPERTIES_ENTRY];
    $fake->content = 'changed externally';
    $this->actingAs($user)->putJson($this->link($server, '/properties'), ['content' => 'new', 'original_hash' => hash('sha256', 'old')])->assertConflict();
    expect($fake->callsFor('putContent'))->toBeEmpty();
});

test('a no-op save does not rewrite the file', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileUpdate->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [PROPERTIES_ENTRY];
    $fake->content = "motd=Same\n";
    $this->actingAs($user)->putJson($this->link($server, '/properties'), [
        'content' => $fake->content,
        'original_hash' => hash('sha256', $fake->content),
    ])->assertOk();
    expect($fake->callsFor('putContent'))->toBeEmpty();
});

test('an empty file can be read and saved without whitespace conversion', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileReadContent->value, Permissions::FileUpdate->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [PROPERTIES_ENTRY];
    $fake->content = '';
    $url = $this->link($server, '/properties');
    $this->actingAs($user)->getJson($url)->assertOk()->assertJsonPath('content', '');
    $this->actingAs($user)->putJson($url, ['content' => '', 'original_hash' => hash('sha256', '')])->assertOk();
    expect($fake->callsFor('putContent'))->toBeEmpty();
});

test('a missing properties file is not created by the editor', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileReadContent->value, Permissions::FileUpdate->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [];
    $url = $this->link($server, '/properties');
    $this->actingAs($user)->getJson($url)->assertNotFound();
    $this->actingAs($user)->putJson($url, ['content' => 'motd=New', 'original_hash' => str_repeat('a', 64)])->assertNotFound();
    expect($fake->callsFor('putContent'))->toBeEmpty();
});

test('read and write permissions are independent', function (): void {
    [$reader, $server] = $this->generateTestAccount([Permissions::FileReadContent->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [PROPERTIES_ENTRY];
    $fake->content = 'motd=Old';
    $url = $this->link($server, '/properties');
    $this->actingAs($reader)->getJson($url)->assertOk();
    $this->actingAs($reader)->putJson($url, ['content' => 'motd=New', 'original_hash' => hash('sha256', $fake->content)])->assertForbidden();

    [$writer, $otherServer] = $this->generateTestAccount([Permissions::FileUpdate->value]);
    compatible($otherServer);
    $this->actingAs($writer)->getJson($this->link($otherServer, '/properties'))->assertForbidden();
});

test('permissions, capability, and configured path are enforced on direct API requests', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::ControlConsole->value]);
    $url = $this->link($server, '/properties');
    $this->getJson($url)->assertUnauthorized();
    $this->actingAs($user)->getJson($url)->assertForbidden();
    $this->actingAs($user)->putJson($url, ['content' => 'x', 'original_hash' => str_repeat('a', 64)])->assertForbidden();

    [$reader, $server] = $this->generateTestAccount([Permissions::FileReadContent->value, Permissions::FileUpdate->value]);
    $url = $this->link($server, '/properties');
    $this->actingAs($reader)->getJson($url)->assertForbidden();
    compatible($server);
    $server->egg->update(['config_files' => json_encode(['../server.properties' => ['parser' => 'properties']])]);
    $this->actingAs($reader)->getJson($url)->assertForbidden();
});

test('a symlinked target is never read or written', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileReadContent->value, Permissions::FileUpdate->value]);
    compatible($server);
    $fake = new FakeDaemonFile;
    $fake->directory = [[...PROPERTIES_ENTRY, 'symlink' => true]];
    $this->actingAs($user)->getJson($this->link($server, '/properties'))->assertNotFound();
    expect($fake->callsFor('getContent'))->toBeEmpty();
});
