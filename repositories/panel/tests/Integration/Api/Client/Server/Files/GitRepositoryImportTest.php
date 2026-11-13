<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Client\Server\Files\GitRepositoryImportTest;

use Illuminate\Support\Facades\Http;
use Mockery;
use Pterodactyl\Contracts\Files\CreatesDirectories;
use Pterodactyl\Contracts\Files\DeletesFiles;
use Pterodactyl\Contracts\Files\ListsDirectories;
use Pterodactyl\Contracts\Files\WritesFileContents;
use Pterodactyl\Enum\Permissions;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;
use RuntimeException;
use ZipArchive;

uses(ClientApiIntegrationTestCase::class);

const GIT_URL = 'https://github.com/example/project.git';

function fakeGitHub(): void
{
    Http::preventStrayRequests();
    Http::fake([
        'api.github.com/repos/example/project/branches?per_page=100' => Http::response([
            ['name' => 'develop', 'commit' => ['sha' => str_repeat('b', 40)]],
            ['name' => 'main', 'commit' => ['sha' => str_repeat('a', 40)]],
        ]),
        'api.github.com/repos/example/project' => Http::response(['private' => false, 'default_branch' => 'develop']),
    ]);
}

function fixtureArchive(): string
{
    $path = tempnam(sys_get_temp_dir(), 'ibis-git-fixture-');
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::OVERWRITE);
    $zip->addFromString('project-sha/package.json', '{"dependencies":{"next":"15","react":"19"},"scripts":{"build":"next build","start":"next start"}}');
    $zip->addFromString('project-sha/package-lock.json', '{}');
    $zip->addFromString('project-sha/src/app.ts', 'export default 1');
    $zip->close();
    $bytes = file_get_contents($path);
    unlink($path);

    return $bytes;
}

function fakeGitHubWithArchive(): void
{
    fakeGitHub();
    Http::fake(['codeload.github.com/example/project/zip/'.str_repeat('a', 40) => Http::response(fixtureArchive(), 200)]);
}

test('repository inspection returns real branches and default branch without guessing main', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    fakeGitHub();
    $this->actingAs($user)->postJson($this->link($server, '/files/git/inspect'), ['url' => GIT_URL])
        ->assertOk()->assertJsonPath('repository', 'project')->assertJsonPath('default_branch', 'develop')
        ->assertJsonPath('branches.1.sha', str_repeat('a', 40));
    Http::assertSentCount(2);
});

test('unsupported hosts and non HTTPS URLs are rejected without requests', function (string $url): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    Http::preventStrayRequests();
    Http::fake();
    $this->actingAs($user)->postJson($this->link($server, '/files/git/inspect'), ['url' => $url])->assertUnprocessable();
    Http::assertNothingSent();
})->with(['http' => 'http://github.com/example/project', 'private host' => 'https://127.0.0.1/example/project', 'lookalike' => 'https://github.com.evil.test/example/project', 'credentials' => 'https://user:token@github.com/example/project']);

test('private repositories are rejected', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value]);
    Http::preventStrayRequests();
    Http::fake(['api.github.com/repos/example/project' => Http::response(['private' => true, 'default_branch' => 'main'])]);
    $this->actingAs($user)->postJson($this->link($server, '/files/git/inspect'), ['url' => GIT_URL])->assertUnprocessable();
});

test('import requires read create and delete permissions', function (array $permissions): void {
    [$user, $server] = $this->generateTestAccount($permissions);
    Http::preventStrayRequests();
    Http::fake();
    $this->actingAs($user)->postJson($this->link($server, '/files/git/import'), ['url' => GIT_URL, 'branch' => 'main', 'destination' => 'new-project'])->assertForbidden();
    Http::assertNothingSent();
})->with([
    'read only' => [[Permissions::FileRead->value]],
    'create only' => [[Permissions::FileCreate->value]],
    'read and create' => [[Permissions::FileRead->value, Permissions::FileCreate->value]],
    'create and delete' => [[Permissions::FileCreate->value, Permissions::FileDelete->value]],
]);

test('an existing destination is never overwritten', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value, Permissions::FileCreate->value, Permissions::FileDelete->value]);
    fakeGitHub();
    $lister = Mockery::mock(ListsDirectories::class);
    $lister->shouldReceive('list')->once()->andReturn([['name' => 'new-project', 'file' => false, 'symlink' => false]]);
    app()->instance(ListsDirectories::class, $lister);
    $writer = Mockery::mock(WritesFileContents::class);
    $writer->shouldNotReceive('write');
    app()->instance(WritesFileContents::class, $writer);
    $this->actingAs($user)->postJson($this->link($server, '/files/git/import'), ['url' => GIT_URL, 'branch' => 'main', 'destination' => 'new-project'])->assertConflict();
    Http::assertSentCount(2);
});

test('an unlisted branch cannot be imported', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value, Permissions::FileCreate->value, Permissions::FileDelete->value]);
    fakeGitHub();
    $this->actingAs($user)->postJson($this->link($server, '/files/git/import'), ['url' => GIT_URL, 'branch' => 'not-a-branch', 'destination' => 'new-project'])->assertUnprocessable();
    Http::assertSentCount(2);
});

test('a snapshot imports directly into a new destination without executing code', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value, Permissions::FileCreate->value, Permissions::FileDelete->value]);
    fakeGitHubWithArchive();
    $lister = Mockery::mock(ListsDirectories::class);
    $lister->shouldReceive('list')->once()->andReturn([]);
    app()->instance(ListsDirectories::class, $lister);
    $mkdir = Mockery::mock(CreatesDirectories::class);
    $mkdir->shouldReceive('create')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), 'new-project', '/')->once();
    $mkdir->shouldReceive('create')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), 'src', '/new-project')->once();
    app()->instance(CreatesDirectories::class, $mkdir);
    $writer = Mockery::mock(WritesFileContents::class);
    $writer->shouldReceive('write')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), '/new-project/package.json', Mockery::type('string'))->once();
    $writer->shouldReceive('write')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), '/new-project/package-lock.json', '{}')->once();
    $writer->shouldReceive('write')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), '/new-project/src/app.ts', 'export default 1')->once();
    app()->instance(WritesFileContents::class, $writer);
    $deleter = Mockery::mock(DeletesFiles::class);
    $deleter->shouldNotReceive('delete');
    app()->instance(DeletesFiles::class, $deleter);

    $this->actingAs($user)->postJson($this->link($server, '/files/git/import'), ['url' => GIT_URL, 'branch' => 'main', 'destination' => 'new-project'])
        ->assertOk()->assertJsonPath('commit', str_repeat('a', 40))->assertJsonPath('files', 3)
        ->assertJsonPath('package_lock', true)->assertJsonPath('manifest.dependencies.next', '15');
});

test('a failed Wings write removes only the new destination', function (): void {
    [$user, $server] = $this->generateTestAccount([Permissions::FileRead->value, Permissions::FileCreate->value, Permissions::FileDelete->value]);
    fakeGitHubWithArchive();
    $lister = Mockery::mock(ListsDirectories::class);
    $lister->shouldReceive('list')->once()->andReturn([]);
    app()->instance(ListsDirectories::class, $lister);
    $mkdir = Mockery::mock(CreatesDirectories::class);
    $mkdir->shouldReceive('create')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), 'new-project', '/')->once();
    app()->instance(CreatesDirectories::class, $mkdir);
    $writer = Mockery::mock(WritesFileContents::class);
    $writer->shouldReceive('write')->once()->andThrow(new RuntimeException('Wings write failed'));
    app()->instance(WritesFileContents::class, $writer);
    $deleter = Mockery::mock(DeletesFiles::class);
    $deleter->shouldReceive('delete')->with(Mockery::on(fn ($actual) => $actual->id === $server->id), '/', ['new-project'])->once();
    app()->instance(DeletesFiles::class, $deleter);

    $this->actingAs($user)->postJson($this->link($server, '/files/git/import'), ['url' => GIT_URL, 'branch' => 'main', 'destination' => 'new-project'])->assertServerError();
});
