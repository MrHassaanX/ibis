<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Files;

use Illuminate\Support\Facades\Http;
use Pterodactyl\Contracts\Files\CreatesDirectories;
use Pterodactyl\Contracts\Files\DeletesFiles;
use Pterodactyl\Contracts\Files\ListsDirectories;
use Pterodactyl\Contracts\Files\WritesFileContents;
use Pterodactyl\Models\Server;
use RuntimeException;
use Throwable;
use ZipArchive;

final readonly class GitHubRepositoryImporter
{
    private const int MAX_DOWNLOAD = 50_000_000;

    private const int MAX_EXTRACTED = 100_000_000;

    private const int MAX_FILES = 1000;

    public function __construct(private ListsDirectories $list, private CreatesDirectories $create, private WritesFileContents $write, private DeletesFiles $delete) {}

    /** @return array{owner:string,repository:string,default_branch:string,branches:list<array{name:string,sha:string}>} */
    public function inspect(string $url): array
    {
        [$owner, $repository] = $this->parseUrl($url);
        $metadata = $this->github("repos/$owner/$repository");
        abort_if(($metadata['private'] ?? true) !== false, 422, 'Only public GitHub repositories can be imported.');
        $branches = $this->github("repos/$owner/$repository/branches?per_page=100");
        abort_unless(array_is_list($branches), 502, 'GitHub returned invalid branch data.');
        $result = [];
        foreach ($branches as $branch) {
            $name = $branch['name'] ?? null;
            $sha = $branch['commit']['sha'] ?? null;
            if (is_string($name) && is_string($sha) && preg_match('/^[a-f0-9]{40}$/D', $sha)) {
                $result[] = ['name' => $name, 'sha' => $sha];
            }
        }
        abort_if($result === [], 422, 'No usable branches were found.');

        return ['owner' => $owner, 'repository' => $repository, 'default_branch' => $metadata['default_branch'], 'branches' => $result];
    }

    /** @return array{commit:string,files:int,bytes:int,manifest:array<string,mixed>|null} */
    public function import(Server $server, string $url, string $branch, string $destination): array
    {
        abort_unless(preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/D', $destination) && $destination !== '.' && $destination !== '..', 422, 'Choose a new directory name in the server root.');
        $repository = $this->inspect($url);
        $selected = collect($repository['branches'])->firstWhere('name', $branch);
        abort_if($selected === null, 422, 'Select a listed branch.');
        $existing = $this->list->list($server, '/');
        abort_if(collect($existing)->contains(fn ($item) => ($item['name'] ?? null) === $destination), 409, 'The destination already exists. Choose a new directory.');

        $archive = tempnam(sys_get_temp_dir(), 'ibis-git-');
        abort_if($archive === false, 500, 'Could not prepare the import.');
        $zip = new ZipArchive;
        $created = false;
        $opened = false;
        try {
            $url = sprintf('https://codeload.github.com/%s/%s/zip/%s', $repository['owner'], $repository['repository'], $selected['sha']);
            $response = Http::withHeaders(['User-Agent' => 'IbisPanel-Git-Importer', 'Accept' => 'application/zip'])
                ->withoutRedirecting()->timeout(120)->withOptions(['sink' => $archive, 'progress' => static function ($total, $downloaded): void {
                    if ($downloaded > self::MAX_DOWNLOAD || $total > self::MAX_DOWNLOAD) {
                        throw new RuntimeException('Repository archive exceeds the 50 MB download limit.');
                    }
                }])->get($url);
            abort_unless($response->successful(), 502, 'GitHub archive download failed.');
            abort_if(filesize($archive) > self::MAX_DOWNLOAD, 422, 'The repository archive is too large.');
            abort_unless($zip->open($archive) === true, 422, 'The repository archive is invalid.');
            $opened = true;
            [$entries, $bytes, $lockfile] = $this->validateArchive($zip);
            $manifest = null;
            abort_if($entries === [], 422, 'The repository has no files to import.');
            $this->create->create($server, $destination, '/');
            $created = true;
            $directories = [];
            foreach ($entries as [$index, $relative]) {
                $parts = explode('/', $relative);
                array_pop($parts);
                $path = '/'.$destination;
                foreach ($parts as $part) {
                    $next = $path.'/'.$part;
                    if (! isset($directories[$next])) {
                        $this->create->create($server, $part, $path);
                        $directories[$next] = true;
                    }
                    $path = $next;
                }
                $contents = $zip->getFromIndex($index);
                abort_if($contents === false || mb_strlen($contents) > 10_000_000, 422, 'Repository file could not be verified.');
                $this->write->write($server, '/'.$destination.'/'.$relative, $contents);
                if ($relative === 'package.json' && mb_strlen($contents) < 200_000) {
                    $parsed = json_decode($contents, true);
                    $manifest = is_array($parsed) ? $parsed : null;
                }
            }

            return ['commit' => $selected['sha'], 'files' => count($entries), 'bytes' => $bytes, 'manifest' => $manifest, 'package_lock' => $lockfile];
        } catch (Throwable $exception) {
            if ($created) {
                try {
                    $this->delete->delete($server, '/', [$destination]);
                } catch (Throwable $rollbackFailure) {
                    throw new RuntimeException('Import failed and the new directory could not be removed. Inspect it before retrying.', previous: $rollbackFailure);
                }
            }
            throw $exception;
        } finally {
            if ($opened) {
                $zip->close();
            }
            @unlink($archive);
        }
    }

    /** @return array{0:list<array{int,string}>,1:int,2:bool} */
    private function validateArchive(ZipArchive $zip): array
    {
        $entries = [];
        $bytes = 0;
        $lockfile = false;
        $archiveRoot = null;
        $seen = [];
        abort_if($zip->numFiles > self::MAX_FILES * 2, 422, 'Repository archive has too many entries.');
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            abort_if(! is_array($stat), 422, 'Invalid archive entry.');
            $name = $stat['name'];
            $parts = explode('/', $name);
            $root = array_shift($parts); // GitHub's single archive root.
            $relative = implode('/', $parts);
            $archiveRoot ??= $root;
            $segments = str_ends_with($name, '/') ? array_slice($parts, 0, -1) : $parts;
            abort_if($root !== $archiveRoot || ! is_string($root) || $root === '' || preg_match('/[\\x00-\\x1f\\x7f\\\\:]/', $name) || str_starts_with($name, '/') || in_array('', $segments, true) || in_array('.', $segments, true) || in_array('..', $segments, true), 422, 'Unsafe archive path.');
            $opsys = 0;
            $attributes = 0;
            $zip->getExternalAttributesIndex($i, $opsys, $attributes);
            abort_if((($attributes >> 16) & 0170000) === 0120000, 422, 'Symlinks are not supported in repository imports.');
            if ($relative === '' || str_ends_with($name, '/')) {
                continue;
            }
            abort_if(isset($seen[$relative]), 422, 'Repository archive contains duplicate paths.');
            $seen[$relative] = true;
            $bytes += (int) $stat['size'];
            abort_if(count($entries) >= self::MAX_FILES || $bytes > self::MAX_EXTRACTED || $stat['size'] > 10_000_000, 422, 'Repository exceeds import limits.');
            $entries[] = [$i, $relative];
            $lockfile = $lockfile || $relative === 'package-lock.json';
        }

        return [$entries, $bytes, $lockfile];
    }

    /** @return array{0:string,1:string} */
    private function parseUrl(string $url): array
    {
        abort_unless(preg_match('~^https://github\.com/([A-Za-z0-9-]+)/([A-Za-z0-9._-]+)/?$~D', trim($url), $matches), 422, 'Enter a public HTTPS GitHub repository URL.');

        $repository = preg_replace('/\\.git$/', '', $matches[2]);
        abort_if($repository === '' || $repository === '.' || $repository === '..', 422, 'Enter a valid GitHub repository URL.');

        return [$matches[1], $repository];
    }

    private function github(string $path): array
    {
        $response = Http::withHeaders(['User-Agent' => 'IbisPanel-Git-Importer', 'Accept' => 'application/vnd.github+json'])
            ->withoutRedirecting()->timeout(15)->get('https://api.github.com/'.$path);
        abort_unless($response->successful() && is_array($response->json()), 502, 'GitHub metadata is unavailable.');

        return $response->json();
    }
}
