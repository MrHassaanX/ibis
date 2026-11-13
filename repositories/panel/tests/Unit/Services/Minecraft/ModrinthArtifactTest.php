<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Unit\Services\Minecraft\ModrinthArtifactTest;

use Illuminate\Support\Facades\Http;
use Pterodactyl\Services\Minecraft\ModrinthArtifact;
use Pterodactyl\Tests\TestCase;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(TestCase::class);

function fixture(string $body = 'verified jar'): array
{
    return [
        'url' => 'https://cdn.modrinth.com/data/AbCd1234/versions/EfGh5678/example.jar',
        'hashes' => ['sha512' => hash('sha512', $body)],
    ];
}

function downloader(array $addresses = ['1.1.1.1']): ModrinthArtifact
{
    return new ModrinthArtifact(fn (string $host): array => $host === 'cdn.modrinth.com' ? $addresses : []);
}

test('a pinned CDN response is accepted only when its SHA-512 hash matches', function (): void {
    Http::preventStrayRequests();
    Http::fake(['cdn.modrinth.com/*' => Http::response('verified jar', 200)]);

    expect(downloader()->download(fixture()))->toBe('verified jar');
    Http::assertSentCount(1);
});

test('a hash mismatch cannot be installed', function (): void {
    Http::preventStrayRequests();
    Http::fake(['cdn.modrinth.com/*' => Http::response('tampered jar', 200)]);

    expect(fn () => downloader()->download(fixture()))->toThrow(HttpException::class);
});

test('arbitrary hosts, private CDN addresses and redirects are rejected', function (): void {
    Http::preventStrayRequests();
    $file = fixture();
    $file['url'] = 'https://127.0.0.1/internal.jar';
    expect(fn () => downloader()->download($file))->toThrow(HttpException::class);

    expect(fn () => downloader(['127.0.0.1'])->download(fixture()))->toThrow(HttpException::class);
    Http::assertNothingSent();

    Http::fake(['cdn.modrinth.com/*' => Http::response('', 302, ['Location' => 'https://example.com/other.jar'])]);
    expect(fn () => downloader()->download(fixture()))->toThrow(HttpException::class);
});

test('oversized artifacts are rejected before reading the stream', function (): void {
    Http::preventStrayRequests();
    Http::fake(['cdn.modrinth.com/*' => Http::response('ignored', 200, ['Content-Length' => (string) (ModrinthArtifact::MAX_BYTES + 1)])]);

    expect(fn () => downloader()->download(fixture()))->toThrow(HttpException::class);
});
