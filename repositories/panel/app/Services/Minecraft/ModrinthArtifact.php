<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Minecraft;

use Closure;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Downloads only pinned Modrinth CDN artifacts, bounded in size and verified by SHA-512. */
final class ModrinthArtifact
{
    public const int MAX_BYTES = 32 * 1024 * 1024;

    /** @param ?Closure(string): list<string> $resolveAddresses */
    public function __construct(private readonly ?Closure $resolveAddresses = null) {}

    public function download(array $file): string
    {
        $url = $file['url'] ?? null;
        $hash = $file['hashes']['sha512'] ?? null;
        if (! is_string($url) || ! preg_match('~^https://cdn\.modrinth\.com/data/[A-Za-z0-9/_\.%-]+\.jar$~D', $url)
            || ! is_string($hash) || ! preg_match('/^[a-f0-9]{128}$/D', $hash)) {
            throw new HttpException(422, 'The release has no safe CDN URL or SHA-512 checksum.');
        }

        $addresses = $this->resolveAddresses === null ? gethostbynamel('cdn.modrinth.com') : ($this->resolveAddresses)('cdn.modrinth.com');
        $ip = null;
        foreach ($addresses ?: [] as $candidate) {
            if (filter_var($candidate, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                $ip = $candidate;
                break;
            }
        }
        throw_unless($ip !== null, HttpException::class, 502, 'The content CDN did not resolve to a public address.');

        try {
            $response = Http::withHeaders(['User-Agent' => 'IbisPanel/1.0 (Minecraft content manager)'])
                ->connectTimeout(5)->timeout(60)->withoutRedirecting()
                ->withOptions(['stream' => true, 'curl' => [CURLOPT_RESOLVE => ['cdn.modrinth.com:443:'.$ip]]])
                ->get($url);
        } catch (ConnectionException $e) {
            throw new HttpException(502, 'The artifact download failed.', $e);
        }

        throw_unless($response->status() === 200, HttpException::class, 502, 'The artifact CDN returned an error or redirect.');
        $length = $response->header('Content-Length');
        abort_if(is_string($length) && ctype_digit($length) && (int) $length > self::MAX_BYTES, 422, 'The artifact exceeds the 32 MiB limit.');

        $stream = $response->toPsrResponse()->getBody();
        $contents = '';
        while (! $stream->eof()) {
            $contents .= $stream->read(65536);
            abort_if(mb_strlen($contents) > self::MAX_BYTES, 422, 'The artifact exceeds the 32 MiB limit.');
        }
        abort_if($contents === '' || ! hash_equals($hash, hash('sha512', $contents)), 422, 'The artifact SHA-512 checksum did not match Modrinth metadata.');

        return $contents;
    }
}
