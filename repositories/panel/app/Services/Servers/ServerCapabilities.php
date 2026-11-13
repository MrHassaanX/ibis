<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Servers;

use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;

/**
 * Resolves workload capabilities from administrator-managed Egg metadata.
 * These values are advisory for navigation; every feature endpoint must also
 * call require() after its normal user permission check.
 */
final class ServerCapabilities
{
    public const string MINECRAFT_JAVA = 'minecraft.java';

    public const string MINECRAFT_BEDROCK = 'minecraft.bedrock';

    public const string MINECRAFT_PROPERTIES = 'minecraft.properties';

    public const string MINECRAFT_PLUGINS = 'minecraft.plugins';

    public const string MINECRAFT_MODS = 'minecraft.mods';

    public const string SERVICE_HTTP = 'service.http';

    public const string SERVICE_BACKGROUND_WORKER = 'service.background-worker';

    /** @return list<string> */
    public function forServer(Server $server): array
    {
        $server->loadMissing('egg.tags');

        if ($server->egg === null) {
            return [];
        }

        $capabilities = $this->forEgg($server->egg);
        if (! in_array(self::MINECRAFT_JAVA, $capabilities, true) || ! $server->exists) {
            return $capabilities;
        }

        $profile = app(MinecraftContentProfile::class)->forServer($server);
        $type = $profile === null ? null : MinecraftContentProfile::typeFor($profile['software']);
        if ($type === 'plugin') {
            $capabilities[] = self::MINECRAFT_PLUGINS;
        } elseif ($type === 'mod') {
            $capabilities[] = self::MINECRAFT_MODS;
        }

        return $capabilities;
    }

    /** @return list<string> */
    public function forEgg(Egg $egg): array
    {
        $tags = array_fill_keys($egg->tagSlugs(), true);
        $features = array_fill_keys(array_map('strtolower', $egg->inherit_features ?? []), true);
        $capabilities = [];
        $propertiesPath = MinecraftPropertiesFile::pathForEgg($egg);

        $java = isset($tags['minecraft']) && ! isset($tags['bedrock'])
            && (isset($features[self::MINECRAFT_JAVA]) || $propertiesPath !== null);
        $bedrock = isset($tags['minecraft'], $tags['bedrock'], $features[self::MINECRAFT_BEDROCK]);

        if ($java) {
            $capabilities[] = self::MINECRAFT_JAVA;
            if ($propertiesPath !== null) {
                $capabilities[] = self::MINECRAFT_PROPERTIES;
            }
        }

        if ($bedrock) {
            $capabilities[] = self::MINECRAFT_BEDROCK;
        }

        foreach ([self::SERVICE_HTTP, self::SERVICE_BACKGROUND_WORKER] as $capability) {
            if (isset($features[$capability])) {
                $capabilities[] = $capability;
            }
        }

        return $capabilities;
    }

    public function supports(Server $server, string $capability): bool
    {
        return in_array($capability, $this->forServer($server), true);
    }

    /** @throws AuthorizationException */
    public function require(Server $server, string $capability): void
    {
        if (! $this->supports($server, $capability)) {
            throw new AuthorizationException('This server does not support the requested feature.');
        }
    }
}
