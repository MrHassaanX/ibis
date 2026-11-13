<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Minecraft;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Read-only catalog access. IDs and download URLs are re-fetched on every mutation. */
final class ModrinthClient
{
    private const string BASE_URL = 'https://api.modrinth.com/v2';

    public function search(string $type, string $loader, string $minecraftVersion, string $query, int $offset): array
    {
        $facets = json_encode([
            // Plugin releases may belong to projects whose primary type is "mod".
            [$type === 'plugin' ? 'all_project_types:plugin' : 'project_type:mod'],
            ['categories:'.$loader],
            ['versions:'.$minecraftVersion],
        ], JSON_THROW_ON_ERROR);

        return Cache::remember('modrinth:search:'.hash('sha256', $facets.$query.$offset), 300,
            fn (): array => $this->get('/search', ['query' => $query, 'facets' => $facets, 'offset' => $offset, 'limit' => 20]));
    }

    public function project(string $id): array
    {
        $this->id($id);

        return Cache::remember('modrinth:project:'.$id, 600, fn (): array => $this->get('/project/'.$id));
    }

    public function versions(string $id, string $loader, string $minecraftVersion): array
    {
        $this->id($id);
        $key = 'modrinth:versions:'.$id.':'.$loader.':'.$minecraftVersion;

        return Cache::remember($key, 300, fn (): array => $this->get('/project/'.$id.'/version', [
            'loaders' => json_encode([$loader], JSON_THROW_ON_ERROR),
            'game_versions' => json_encode([$minecraftVersion], JSON_THROW_ON_ERROR),
        ]));
    }

    public function version(string $id): array
    {
        $this->id($id);

        // Never serve cached release metadata when about to download executable content.
        return $this->get('/version/'.$id);
    }

    private function get(string $path, array $query = []): array
    {
        try {
            $response = Http::acceptJson()
                ->withHeaders(['User-Agent' => 'IbisPanel/1.0 (local Minecraft content manager; https://github.com/IbisPanel)'])
                ->connectTimeout(5)->timeout(15)->withoutRedirecting()
                ->get(self::BASE_URL.$path, $query);
        } catch (ConnectionException $e) {
            throw new HttpException(502, 'The Modrinth catalog could not be reached.', $e);
        }

        $this->assertResponse($response);
        $data = $response->json();
        throw_unless(is_array($data), HttpException::class, 502, 'The Modrinth catalog returned invalid data.');

        return $data;
    }

    private function assertResponse(Response $response): void
    {
        if ($response->status() === 429) {
            throw new HttpException(503, 'Modrinth is rate limiting requests. Please retry shortly.');
        }
        if ($response->status() === 404) {
            throw new HttpException(404, 'The requested Modrinth entry was not found.');
        }
        throw_unless($response->successful(), HttpException::class, 502, 'The Modrinth catalog is unavailable.');
    }

    private function id(string $id): void
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{8,24}$/D', $id), 422, 'Invalid Modrinth identifier.');
    }
}
