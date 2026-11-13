<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Minecraft;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Pterodactyl\Contracts\Files\CreatesDirectories;
use Pterodactyl\Contracts\Files\DeletesFiles;
use Pterodactyl\Contracts\Files\ListsDirectories;
use Pterodactyl\Contracts\Files\ReadsFileContents;
use Pterodactyl\Contracts\Files\RenamesFiles;
use Pterodactyl\Contracts\Files\WritesFileContents;
use Pterodactyl\Facades\Daemon;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\MinecraftContentProfile;
use Pterodactyl\Services\Servers\ServerCapabilities;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

final readonly class MinecraftContentService
{
    public function __construct(
        private MinecraftContentProfile $profiles,
        private ServerCapabilities $capabilities,
        private ModrinthClient $catalog,
        private ModrinthArtifact $artifact,
        private ListsDirectories $directories,
        private CreatesDirectories $mkdir,
        private ReadsFileContents $reader,
        private WritesFileContents $writer,
        private RenamesFiles $renamer,
        private DeletesFiles $deleter,
    ) {}

    /** @return array{software: string, minecraft_version: string, loader_version: ?string} */
    public function profile(Server $server, string $type): array
    {
        abort_unless(in_array($type, ['plugin', 'mod'], true), 404);
        $this->capabilities->require($server, $type === 'plugin' ? ServerCapabilities::MINECRAFT_PLUGINS : ServerCapabilities::MINECRAFT_MODS);
        $profile = $this->profiles->forServer($server);
        abort_unless($profile !== null && MinecraftContentProfile::typeFor($profile['software']) === $type, 422, 'An administrator must verify this server software and version.');

        return $profile;
    }

    public function search(Server $server, string $type, string $query, int $offset): array
    {
        $profile = $this->profile($server, $type);
        $data = $this->catalog->search($type, $profile['software'], $profile['minecraft_version'], $query, $offset);
        abort_unless(isset($data['hits'], $data['total_hits']) && is_array($data['hits']) && is_int($data['total_hits']), 502, 'Modrinth returned an invalid search response.');
        $hits = [];
        foreach ($data['hits'] as $hit) {
            if (! is_array($hit) || ($hit['server_side'] ?? '') === 'unsupported' || ! is_string($hit['project_id'] ?? null)) {
                continue;
            }
            $hits[] = [
                'id' => $hit['project_id'], 'title' => (string) ($hit['title'] ?? ''),
                'description' => (string) ($hit['description'] ?? ''),
                'icon_url' => $hit['icon_url'] ?? null, 'author' => (string) ($hit['author'] ?? ''),
            ];
        }

        return ['hits' => $hits, 'total' => $data['total_hits'], 'offset' => $offset];
    }

    public function versions(Server $server, string $type, string $projectId): array
    {
        $profile = $this->profile($server, $type);
        $project = $this->catalog->project($projectId);
        $this->assertProject($project, $projectId, $type);
        $versions = $this->catalog->versions($projectId, $profile['software'], $profile['minecraft_version']);
        abort_unless(array_is_list($versions), 502, 'Modrinth returned an invalid release list.');

        return [
            'project' => [
                'id' => $projectId, 'title' => (string) ($project['title'] ?? ''),
                'description' => (string) ($project['description'] ?? ''),
                'icon_url' => $project['icon_url'] ?? null,
                'license' => $project['license']['name'] ?? $project['license']['id'] ?? 'Unknown',
                'url' => 'https://modrinth.com/'.$type.'/'.rawurlencode((string) ($project['slug'] ?? $projectId)),
            ],
            'versions' => array_values(array_map(fn (array $v): array => $this->versionSummary($v), array_filter($versions, fn ($v): bool => is_array($v) && $this->compatible($v, $profile)))),
        ];
    }

    public function release(Server $server, string $type, string $projectId, string $versionId): array
    {
        $profile = $this->profile($server, $type);
        $project = $this->catalog->project($projectId);
        $this->assertProject($project, $projectId, $type);
        $version = $this->catalog->version($versionId);
        abort_unless(($version['project_id'] ?? null) === $projectId && $this->compatible($version, $profile), 422, 'This release is not compatible with the verified server profile.');
        $file = $this->primaryFile($version);
        $dependencies = $this->dependencies($version);

        return ['project' => $project, 'version' => $version, 'file' => $file, 'dependencies' => $dependencies];
    }

    /** @return list<array<string, mixed>> */
    public function installed(Server $server, string $type): array
    {
        $profile = $this->profile($server, $type);

        $directory = $type === 'plugin' ? '/plugins' : '/mods';

        $workerAvailable = Cache::has('ibis:minecraft-content:worker');

        return DB::table('minecraft_managed_content')->where('server_id', $server->id)->where('type', $type)->orderBy('created_at')->get()->map(function ($row) use ($server, $directory, $profile, $workerAvailable): array {
            $record = (array) $row;
            $record['updated_at'] = Carbon::parse($row->updated_at, 'UTC')->toIso8601String();
            $stalled = $this->stalled($row);
            $record['display_state'] = $stalled ? 'stalled' : ($row->state === 'queued' && ! $workerAvailable ? 'worker_unavailable' : $row->state);
            $record['worker_available'] = $workerAvailable;
            $record['can_retry'] = $stalled || $row->state === 'failed';
            $record['file_status'] = null;
            $record['update_available'] = null;
            $record['latest_version_id'] = null;
            if ($row->sha512 !== null && in_array($row->state, ['installed', 'failed'], true)) {
                try {
                    $this->assertManagedFile($server, $directory, $row->filename, $row->sha512);
                    $record['file_status'] = 'verified';
                } catch (Throwable) {
                    $record['file_status'] = 'missing_or_changed';
                }
            }
            if ($row->state === 'installed' && $record['file_status'] === 'verified') {
                try {
                    $versions = $this->catalog->versions($row->project_id, $profile['software'], $profile['minecraft_version']);
                    $compatible = array_values(array_filter($versions, fn ($version): bool => is_array($version) && $this->compatible($version, $profile)));
                    usort($compatible, fn (array $left, array $right): int => strcmp((string) ($right['date_published'] ?? ''), (string) ($left['date_published'] ?? '')));
                    $latest = $compatible[0]['id'] ?? null;
                    if (is_string($latest)) {
                        $record['latest_version_id'] = $latest;
                        $record['update_available'] = $latest !== $row->version_id;
                    }
                } catch (Throwable) {
                    // A catalog outage must not hide local installation records.
                }
            }

            return $record;
        })->all();
    }

    public function queueInstall(Server $server, string $type, string $projectId, string $versionId): array
    {
        $lookup = fn () => DB::table('minecraft_managed_content')->where('server_id', $server->id)->where('type', $type)->where('provider', 'modrinth')->where('project_id', $projectId);
        $pending = $lookup()->first();
        if ($pending !== null && in_array($pending->state, ['queued', 'downloading', 'verifying', 'installing'], true)
            && ! $this->stalled($pending) && $pending->requested_version_id === $versionId) {
            return (array) $pending;
        }

        $release = $this->release($server, $type, $projectId, $versionId);
        $this->assertStopped($server);
        $this->assertDependencies($server, $release['dependencies']);
        $filename = 'ibis-modrinth-'.$projectId.'-'.$versionId.'.jar';
        $operationId = (string) Str::uuid();
        $result = DB::transaction(function () use ($lookup, $server, $type, $projectId, $versionId, $filename, $operationId): array {
            $existing = $lookup()->lockForUpdate()->first();
            abort_if($existing !== null && in_array($existing->state, ['queued', 'downloading', 'verifying', 'installing'], true)
                && ! $this->stalled($existing), 409, 'A content operation is already in progress.');
            abort_if($existing !== null && $existing->version_id === $versionId && $existing->state === 'installed', 409, 'This release is already installed.');

            $values = [
                'server_id' => $server->id, 'type' => $type, 'provider' => 'modrinth', 'project_id' => $projectId,
                'version_id' => $existing?->version_id ?? $versionId,
                'requested_version_id' => $versionId, 'operation_id' => $operationId,
                'filename' => $existing?->filename ?? $filename,
                'sha512' => $existing?->sha512,
                'state' => 'queued', 'error' => null, 'updated_at' => now(),
            ];
            if ($existing === null) {
                $id = DB::table('minecraft_managed_content')->insertGetId([...$values, 'created_at' => now()]);
            } else {
                DB::table('minecraft_managed_content')->where('id', $existing->id)->update($values);
                $id = $existing->id;
            }

            return ['id' => $id, 'operation_id' => $operationId];
        });
        try {
            \Pterodactyl\Jobs\MinecraftContentInstallJob::dispatch($result['id'], $versionId, $result['operation_id']);
        } catch (Throwable $e) {
            DB::table('minecraft_managed_content')->where('id', $result['id'])->where('operation_id', $result['operation_id'])
                ->update(['state' => 'failed', 'error' => 'The content queue is unavailable. Retry when its worker is ready.', 'updated_at' => now()]);
            throw new HttpException(503, 'The content queue is unavailable. Retry shortly.', $e);
        }

        return (array) DB::table('minecraft_managed_content')->find($result['id']);
    }

    public function perform(int $id, string $versionId, string $operationId): void
    {
        $row = DB::table('minecraft_managed_content')->find($id);
        if ($row === null || $row->state !== 'queued' || $row->operation_id !== $operationId || $row->requested_version_id !== $versionId) {
            return;
        }
        if (DB::table('minecraft_managed_content')->where('id', $id)->where('operation_id', $operationId)->where('state', 'queued')
            ->update(['state' => 'downloading', 'updated_at' => now()]) !== 1) {
            return;
        }
        $server = Server::query()->with(['egg.tags', 'node', 'allocation'])->findOrFail($row->server_id);
        $directory = $row->type === 'plugin' ? '/plugins' : '/mods';
        $filename = 'ibis-modrinth-'.$row->project_id.'-'.$versionId.'.jar';
        $temporary = '.ibis-'.$id.'-'.bin2hex(random_bytes(6)).'.part';
        $backup = '.ibis-previous-'.$id.'.part';
        $wroteTemporary = false;
        $wroteTarget = false;
        $backedUpPrevious = false;
        $committed = false;
        $contentHash = null;

        try {
            $release = $this->release($server, $row->type, $row->project_id, $versionId);
            $this->assertStopped($server);
            $this->assertDependencies($server, $release['dependencies']);
            $content = $this->artifact->download($release['file']);
            $contentHash = hash('sha512', $content);
            $this->ensureDirectory($server, $directory);
            $this->assertVacant($server, $directory, $filename);
            if ($row->sha512 !== null) {
                $this->assertManagedFile($server, $directory, $row->filename, $row->sha512);
                $this->assertVacant($server, $directory, $backup);
            }
            $this->writer->write($server, $directory.'/'.$temporary, $content);
            $wroteTemporary = true;
            DB::table('minecraft_managed_content')->where('id', $id)->where('operation_id', $operationId)->update(['state' => 'verifying', 'updated_at' => now()]);
            abort_unless(hash_equals($contentHash, hash('sha512', $this->reader->read($server, $directory.'/'.$temporary, ModrinthArtifact::MAX_BYTES + 1))), 502, 'Wings did not retain the expected artifact bytes.');
            DB::table('minecraft_managed_content')->where('id', $id)->where('operation_id', $operationId)->update(['state' => 'installing', 'updated_at' => now()]);
            $this->assertStopped($server);
            $this->assertVacant($server, $directory, $filename);
            if ($row->sha512 !== null && $row->filename !== $filename) {
                $this->assertManagedFile($server, $directory, $row->filename, $row->sha512);
                // A non-jar backup cannot be loaded by the Minecraft server if this job stops.
                $this->renamer->rename($server, $directory, [['from' => $row->filename, 'to' => $backup]]);
                $backedUpPrevious = true;
            }
            $this->renamer->rename($server, $directory, [['from' => $temporary, 'to' => $filename]]);
            $wroteTemporary = false;
            $wroteTarget = true;
            DB::table('minecraft_managed_content')->where('id', $id)->where('operation_id', $operationId)->update([
                'version_id' => $versionId, 'filename' => $filename,
                'sha512' => $contentHash, 'state' => 'installed', 'error' => null, 'requested_version_id' => null, 'updated_at' => now(),
            ]);
            $committed = true;
            if ($backedUpPrevious) {
                try {
                    $this->deleter->delete($server, $directory, [$backup]);
                } catch (Throwable) {
                    // Keep the inert backup for manual recovery; the committed jar remains tracked.
                    DB::table('minecraft_managed_content')->where('id', $id)->update(['error' => 'A previous-version backup remains in Files and needs manual cleanup.']);
                }
            }
        } catch (Throwable $e) {
            if ($committed) {
                return;
            }
            if ($wroteTarget) {
                try {
                    $this->assertManagedFile($server, $directory, $filename, $contentHash);
                    $this->deleter->delete($server, $directory, [$filename]);
                } catch (Throwable) {
                }
            }
            if ($backedUpPrevious) {
                try {
                    $this->assertVacant($server, $directory, $row->filename);
                    $this->renamer->rename($server, $directory, [['from' => $backup, 'to' => $row->filename]]);
                } catch (Throwable) {
                }
            }
            if ($wroteTemporary) {
                try {
                    $this->deleter->delete($server, $directory, [$temporary]);
                } catch (Throwable) {
                }
            }
            DB::table('minecraft_managed_content')->where('id', $id)->where('operation_id', $operationId)->update([
                'state' => 'failed', 'error' => $this->failureReason($e), 'updated_at' => now(),
            ]);
        }
    }

    public function remove(Server $server, string $type, int $id): void
    {
        $this->profile($server, $type);
        $this->assertStopped($server);
        $row = DB::table('minecraft_managed_content')->where('id', $id)->where('server_id', $server->id)->where('type', $type)->first();
        abort_unless($row !== null && in_array($row->state, ['installed', 'failed'], true) && $row->sha512 !== null, 404);
        $directory = $type === 'plugin' ? '/plugins' : '/mods';
        $this->assertManagedFile($server, $directory, $row->filename, $row->sha512);
        $this->deleter->delete($server, $directory, [$row->filename]);
        DB::table('minecraft_managed_content')->where('id', $id)->delete();
    }

    private function stalled(object $row): bool
    {
        return in_array($row->state, ['queued', 'downloading', 'verifying', 'installing'], true)
            && Carbon::parse($row->updated_at, 'UTC')->lt(now()->subMinutes(5));
    }

    private function failureReason(Throwable $error): string
    {
        return $error instanceof HttpException && in_array($error->getStatusCode(), [409, 422, 502, 503], true)
            ? mb_substr($error->getMessage(), 0, 300)
            : 'The installation failed. Check Wings connectivity and the release, then retry.';
    }

    private function assertProject(array $project, string $id, string $type): void
    {
        abort_unless(($project['id'] ?? null) === $id && ($project['project_type'] ?? null) === 'mod', 422, 'The project type does not match this server.');
        abort_if(($project['server_side'] ?? null) === 'unsupported', 422, 'This project does not support server installation.');
    }

    private function compatible(array $version, array $profile): bool
    {
        return in_array($profile['software'], $version['loaders'] ?? [], true)
            && in_array($profile['minecraft_version'], $version['game_versions'] ?? [], true)
            && in_array($version['version_type'] ?? null, ['release', 'beta', 'alpha'], true);
    }

    private function versionSummary(array $version): array
    {
        return [
            'id' => (string) ($version['id'] ?? ''), 'name' => (string) ($version['name'] ?? ''),
            'version_number' => (string) ($version['version_number'] ?? ''),
            'version_type' => (string) ($version['version_type'] ?? ''),
            'date_published' => $version['date_published'] ?? null,
            'dependencies' => $this->dependencies($version),
        ];
    }

    private function primaryFile(array $version): array
    {
        foreach ($version['files'] ?? [] as $file) {
            if (is_array($file) && ($file['primary'] ?? false) === true && is_string($file['filename'] ?? null)
                && preg_match('/^[A-Za-z0-9][A-Za-z0-9._+\-]{0,178}\.jar$/D', $file['filename'])) {
                return $file;
            }
        }
        throw new HttpException(422, 'This release has no valid primary server jar.');
    }

    private function dependencies(array $version): array
    {
        $result = [];
        foreach ($version['dependencies'] ?? [] as $dependency) {
            if (is_array($dependency) && in_array($dependency['dependency_type'] ?? null, ['required', 'incompatible', 'optional'], true)) {
                $result[] = [
                    'type' => $dependency['dependency_type'],
                    'project_id' => $dependency['project_id'] ?? null,
                    'version_id' => $dependency['version_id'] ?? null,
                ];
            }
        }

        return $result;
    }

    private function assertDependencies(Server $server, array $dependencies): void
    {
        $installed = DB::table('minecraft_managed_content')->where('server_id', $server->id)->where('state', 'installed')->get()->keyBy('project_id');
        foreach ($dependencies as $dependency) {
            $project = $dependency['project_id'];
            $version = $dependency['version_id'];
            if ($dependency['type'] === 'required') {
                abort_if($project === null || ! $installed->has($project) || ($version !== null && $installed[$project]->version_id !== $version), 409,
                    'A required dependency is missing or has a different version: '.($project ?? $version ?? 'unknown'));
                $record = $installed[$project];
                $profile = $this->profiles->forServer($server);
                abort_if($record->sha512 === null || $profile === null || $record->type !== MinecraftContentProfile::typeFor($profile['software']), 409,
                    'A required dependency is not a verified managed jar.');
                $this->assertManagedFile($server, $record->type === 'plugin' ? '/plugins' : '/mods', $record->filename, $record->sha512);
            }
            if ($dependency['type'] === 'incompatible' && $project !== null && $installed->has($project)) {
                throw new HttpException(409, 'An incompatible project is installed: '.$project);
            }
        }
    }

    private function assertStopped(Server $server): void
    {
        $state = Daemon::server($server)->details();
        abort_unless(($state['state'] ?? null) === 'offline' || ($state['state'] ?? null) === 'stopped', 409,
            'Stop the server before changing plugins or mods.');
    }

    private function ensureDirectory(Server $server, string $directory): void
    {
        $name = ltrim($directory, '/');
        foreach ($this->directories->list($server, '/') as $entry) {
            if (($entry['name'] ?? null) === $name) {
                abort_if(($entry['symlink'] ?? false) || ($entry['file'] ?? true), 409, 'The content directory is unsafe.');

                return;
            }
        }
        $this->mkdir->create($server, $name, '/');
    }

    private function assertVacant(Server $server, string $directory, string $filename): void
    {
        foreach ($this->directories->list($server, $directory) as $entry) {
            abort_if(($entry['name'] ?? null) === $filename, 409, 'A file with this name already exists.');
        }
    }

    private function assertManagedFile(Server $server, string $directory, string $filename, string $hash): void
    {
        abort_unless(preg_match('/^ibis-modrinth-[A-Za-z0-9]+-[A-Za-z0-9]+\.jar$/D', $filename), 409, 'The tracked filename is invalid.');
        foreach ($this->directories->list($server, $directory) as $entry) {
            if (($entry['name'] ?? null) === $filename) {
                abort_if(($entry['symlink'] ?? false) || ! ($entry['file'] ?? false), 409, 'The managed file is unsafe.');
                $current = $this->reader->read($server, $directory.'/'.$filename, ModrinthArtifact::MAX_BYTES + 1);
                abort_unless(hash_equals($hash, hash('sha512', $current)), 409, 'The managed file changed outside IbisPanel.');

                return;
            }
        }
        throw new HttpException(409, 'The managed file is missing.');
    }
}
