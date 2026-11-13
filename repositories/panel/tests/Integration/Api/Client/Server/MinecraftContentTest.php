<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Client\Server\MinecraftContentTest;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Pterodactyl\Enum\Permissions;
use Pterodactyl\Jobs\MinecraftContentInstallJob;
use Pterodactyl\Models\Tag;
use Pterodactyl\Services\Minecraft\MinecraftContentService;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;
use Pterodactyl\Tests\Support\Fakes\FakeDaemonFile;
use RuntimeException;

uses(ClientApiIntegrationTestCase::class);

function withMinecraftProfile($server, string $software): void
{
    $server->egg->tags()->syncWithoutDetaching([Tag::query()->firstOrCreate(['slug' => 'minecraft'], ['name' => 'Minecraft'])->id]);
    $server->egg->update([
        'features' => ['minecraft.java'],
        'config_files' => json_encode(['server.properties' => ['parser' => 'properties', 'find' => []]]),
    ]);
    DB::table('minecraft_content_profiles')->insert([
        'server_id' => $server->id,
        'software' => $software,
        'minecraft_version' => '1.21.11',
        'loader_version' => $software === 'fabric' ? '0.20.1' : null,
        'created_at' => now(), 'updated_at' => now(),
    ]);
}

test('plugin catalog uses the Modrinth plugin facet and verified Paper loader', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    withMinecraftProfile($server, 'paper');
    Http::preventStrayRequests();
    Http::fake(['api.modrinth.com/v2/search*' => Http::response([
        'hits' => [['project_id' => 'Vebnzrzj', 'title' => 'LuckPerms', 'description' => 'Permissions', 'author' => 'lucko', 'server_side' => 'required']],
        'total_hits' => 1,
    ])]);

    $this->actingAs($user)->getJson($this->link($server, '/minecraft-content/plugin/catalog?query=LuckPerms'))
        ->assertOk()->assertJsonPath('hits.0.id', 'Vebnzrzj');
    Http::assertSent(function (Request $request): bool {
        $facets = json_decode($request->data()['facets'] ?? '', true);

        return str_contains($request->url(), '/v2/search') && $facets === [
            ['all_project_types:plugin'], ['categories:paper'], ['versions:1.21.11'],
        ];
    });
});

test('direct mod catalog access is rejected on a Paper server before provider access', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    withMinecraftProfile($server, 'paper');
    Http::preventStrayRequests();

    $this->actingAs($user)->getJson($this->link($server, '/minecraft-content/mod/catalog'))->assertForbidden();
    Http::assertNothingSent();
});

test('a non-Minecraft server cannot access either manager directly', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    Http::preventStrayRequests();

    $this->actingAs($user)->getJson($this->link($server, '/minecraft-content/plugin/catalog'))->assertForbidden();
    $this->actingAs($user)->getJson($this->link($server, '/minecraft-content/mod/catalog'))->assertForbidden();
    Http::assertNothingSent();
});

test('software profiles require an administrator and cannot change while managed content exists', function (): void {
    [$user, $server] = $this->generateTestAccount();
    withMinecraftProfile($server, 'fabric');
    $url = $this->link($server, '/minecraft-profile');
    $data = ['software' => 'paper', 'minecraft_version' => '1.21.11', 'confirmed_installed' => true];

    $this->actingAs($user)->putJson($url, $data)->assertForbidden();
    $user->forceFill(['root_admin' => true])->save();
    $this->actingAs($user)->putJson($url, ['software' => 'paper', 'minecraft_version' => '1.21.11'])->assertUnprocessable();
    $this->actingAs($user)->putJson($url, ['software' => 'fabric', 'minecraft_version' => 'bad!', 'loader_version' => '0.20.1', 'confirmed_installed' => true])->assertUnprocessable();
    DB::table('minecraft_managed_content')->insert([
        'server_id' => $server->id, 'type' => 'mod', 'provider' => 'modrinth',
        'project_id' => 'P7dR8mSH', 'version_id' => '6qAuTtLR',
        'filename' => 'ibis-modrinth-P7dR8mSH-6qAuTtLR.jar',
        'sha512' => str_repeat('a', 128), 'state' => 'installed',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $this->actingAs($user)->putJson($url, $data)->assertConflict();
    $this->actingAs($user)->deleteJson($url)->assertConflict();
});

test('managed installation listings verify the Wings file hash before presenting a jar as intact', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    withMinecraftProfile($server, 'paper');
    $filename = 'ibis-modrinth-Vebnzrzj-b0mk8uS6.jar';
    $fake = new FakeDaemonFile;
    $fake->content = 'original jar bytes';
    $fake->directory = [['name' => $filename, 'file' => true, 'symlink' => false]];
    DB::table('minecraft_managed_content')->insert([
        'server_id' => $server->id, 'type' => 'plugin', 'provider' => 'modrinth',
        'project_id' => 'Vebnzrzj', 'version_id' => 'b0mk8uS6', 'filename' => $filename,
        'sha512' => hash('sha512', $fake->content), 'state' => 'installed',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $url = $this->link($server, '/minecraft-content/plugin/installed');

    $this->actingAs($user)->getJson($url)->assertOk()->assertJsonPath('data.0.file_status', 'verified');
    $fake->content = 'changed by another tool';
    $this->actingAs($user)->getJson($url)->assertOk()->assertJsonPath('data.0.file_status', 'missing_or_changed');
});

test('required dependencies must exist as intact managed jars before an install can be queued', function (): void {
    [, $server] = $this->generateTestAccount();
    withMinecraftProfile($server, 'fabric');
    Queue::fake();
    Http::preventStrayRequests();
    Http::fake([
        'api.modrinth.com/v2/project/P7dR8mSH' => Http::response(['id' => 'P7dR8mSH', 'project_type' => 'mod', 'server_side' => 'optional']),
        'api.modrinth.com/v2/version/6qAuTtLR' => Http::response([
            'project_id' => 'P7dR8mSH', 'loaders' => ['fabric'], 'game_versions' => ['1.21.11'], 'version_type' => 'release',
            'files' => [['primary' => true, 'filename' => 'fabric-api-1.21.11.jar', 'hashes' => ['sha512' => str_repeat('a', 128)]]],
            'dependencies' => [['dependency_type' => 'required', 'project_id' => 'AbCd1234', 'version_id' => null]],
        ]),
        '*/api/servers/*/files/list-directory*' => Http::response([]),
        '*/api/servers/*' => Http::response(['state' => 'offline']),
    ]);
    $service = $this->app->make(MinecraftContentService::class);

    expect(fn () => $service->queueInstall($server, 'mod', 'P7dR8mSH', '6qAuTtLR'))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    DB::table('minecraft_managed_content')->insert([
        'server_id' => $server->id, 'type' => 'mod', 'provider' => 'modrinth',
        'project_id' => 'AbCd1234', 'version_id' => 'EfGh5678',
        'filename' => 'ibis-modrinth-AbCd1234-EfGh5678.jar',
        'sha512' => str_repeat('b', 128), 'state' => 'installed',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    expect(fn () => $service->queueInstall($server, 'mod', 'P7dR8mSH', '6qAuTtLR'))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    expect(DB::table('minecraft_managed_content')->where('project_id', 'P7dR8mSH')->exists())->toBeFalse();
    Queue::assertNothingPushed();
});

test('a stale legacy install can be reviewed and retried on the isolated queue without running old jobs', function (): void {
    [$user, $server] = $this->generateTestAccount([
        Permissions::FileRead->value, Permissions::FileCreate->value,
        Permissions::FileUpdate->value, Permissions::FileDelete->value,
    ]);
    withMinecraftProfile($server, 'paper');
    Cache::forget('ibis:minecraft-content:worker');
    Queue::fake();
    $id = DB::table('minecraft_managed_content')->insertGetId([
        'server_id' => $server->id, 'type' => 'plugin', 'provider' => 'modrinth',
        'project_id' => 'P1OZGk5p', 'version_id' => 'h2Bniign',
        'filename' => 'ibis-modrinth-P1OZGk5p-h2Bniign.jar',
        'state' => 'queued', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $url = $this->link($server, '/minecraft-content/plugin');
    $this->actingAs($user)->getJson($url.'/installed')->assertOk()
        ->assertJsonPath('data.0.display_state', 'worker_unavailable')->assertJsonPath('data.0.can_retry', false);
    DB::table('minecraft_managed_content')->where('id', $id)->update(['updated_at' => now()->subMinutes(10)]);
    $this->actingAs($user)->getJson($url.'/installed')->assertOk()
        ->assertJsonPath('data.0.display_state', 'stalled')->assertJsonPath('data.0.can_retry', true);

    Http::preventStrayRequests();
    Http::fake([
        'api.modrinth.com/v2/project/P1OZGk5p' => Http::response(['id' => 'P1OZGk5p', 'project_type' => 'mod', 'server_side' => 'required']),
        'api.modrinth.com/v2/version/h2Bniign' => Http::response([
            'project_id' => 'P1OZGk5p', 'loaders' => ['paper'], 'game_versions' => ['1.21.11'], 'version_type' => 'release',
            'files' => [['primary' => true, 'filename' => 'safe.jar', 'hashes' => ['sha512' => str_repeat('a', 128)]]],
            'dependencies' => [],
        ]),
        '*/api/servers/*' => Http::response(['state' => 'offline']),
    ]);
    $this->actingAs($user)->postJson($url.'/install', ['project_id' => 'P1OZGk5p', 'version_id' => 'h2Bniign'])
        ->assertAccepted()->assertJsonPath('installation.state', 'queued');
    $row = DB::table('minecraft_managed_content')->find($id);
    expect($row->operation_id)->not->toBeNull();
    Queue::assertPushed(MinecraftContentInstallJob::class, fn (MinecraftContentInstallJob $job): bool => $job->connection === 'redis_minecraft_content' && $job->queue === 'minecraft-content'
        && $job->operationId === $row->operation_id);
    $this->actingAs($user)->postJson($url.'/install', ['project_id' => 'P1OZGk5p', 'version_id' => 'h2Bniign'])
        ->assertAccepted()->assertJsonPath('installation.id', $id);
    Queue::assertPushed(MinecraftContentInstallJob::class, 1);

    (new MinecraftContentInstallJob($id, 'h2Bniign'))->handle($this->app->make(MinecraftContentService::class));
    expect(DB::table('minecraft_managed_content')->find($id)->state)->toBe('queued');
    (new MinecraftContentInstallJob($id, 'h2Bniign', $row->operation_id))->failed(new RuntimeException('private exception detail'));
    $failed = DB::table('minecraft_managed_content')->find($id);
    expect($failed->state)->toBe('failed');
    expect($failed->error)->not->toContain('private exception detail');
});
