<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Servers;

use Illuminate\Support\Facades\DB;
use Pterodactyl\Models\Server;

/** An administrator's explicit, per-server attestation of the installed Java distribution. */
final class MinecraftContentProfile
{
    public const array PLUGIN_SOFTWARE = ['paper', 'spigot', 'purpur', 'folia'];

    public const array MOD_SOFTWARE = ['fabric', 'forge', 'neoforge', 'quilt'];

    public static function typeFor(string $software): ?string
    {
        if (in_array($software, self::PLUGIN_SOFTWARE, true)) {
            return 'plugin';
        }

        return in_array($software, self::MOD_SOFTWARE, true) ? 'mod' : null;
    }

    /** @return array{software: string, minecraft_version: string, loader_version: ?string}|null */
    public function forServer(Server $server): ?array
    {
        $row = DB::table('minecraft_content_profiles')->where('server_id', $server->id)->first();

        return $row === null ? null : [
            'software' => $row->software,
            'minecraft_version' => $row->minecraft_version,
            'loader_version' => $row->loader_version,
        ];
    }
}
