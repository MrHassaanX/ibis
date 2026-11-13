<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Contracts\Files\ListsDirectories;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;

/** Resolves the file from the administrator-managed Egg configuration. */
final readonly class MinecraftPropertiesFile
{
    public function __construct(private ListsDirectories $directories) {}

    public static function pathForEgg(Egg $egg): ?string
    {
        $files = json_decode($egg->inherit_config_files ?? '', true);
        if (! is_array($files)) {
            return null;
        }

        $matches = [];
        foreach ($files as $name => $configuration) {
            if (! is_string($name) || ! is_array($configuration) || ($configuration['parser'] ?? null) !== 'properties') {
                continue;
            }

            $segments = explode('/', $name);
            if (end($segments) !== 'server.properties' || mb_strlen($name) > 2047) {
                continue;
            }

            foreach ($segments as $segment) {
                if ($segment === '' || $segment === '.' || $segment === '..' || ! preg_match('/^[A-Za-z0-9._-]+$/D', $segment)) {
                    continue 2;
                }
            }

            $matches[] = '/'.$name;
        }

        return count($matches) === 1 ? $matches[0] : null;
    }

    /** Reject symlinks anywhere in the configured path, and missing targets. */
    public function isRegularFile(Server $server, string $path): bool
    {
        $parent = '/';
        $segments = explode('/', ltrim($path, '/'));

        foreach ($segments as $index => $name) {
            $entries = $this->directories->list($server, $parent);
            $entry = null;
            foreach ($entries as $candidate) {
                if (($candidate['name'] ?? null) === $name) {
                    $entry = $candidate;
                    break;
                }
            }

            if ($entry === null || ($entry['symlink'] ?? false)) {
                return false;
            }

            $last = $index === count($segments) - 1;
            if ($last) {
                return ($entry['file'] ?? false) === true;
            }

            if (($entry['file'] ?? true) === true) {
                return false;
            }

            $parent .= $name.'/';
        }

        return false;
    }
}
