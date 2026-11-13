<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Appearance;

use Pterodactyl\Models\Server;

/** Resolves visual workload categories from administrator-managed Egg metadata. */
final class WorkloadArtwork
{
    public function category(Server $server): string
    {
        $tags = array_fill_keys($server->egg?->tagSlugs() ?? [], true);
        $features = array_fill_keys(array_map('strtolower', $server->egg?->inherit_features ?? []), true);

        return match (true) {
            isset($tags['minecraft'], $tags['bedrock']), isset($features['minecraft.bedrock']) => 'minecraft-bedrock',
            isset($tags['minecraft']) => 'minecraft',
            isset($tags['hytale']) => 'hytale',
            isset($tags['fivem']) => 'fivem',
            isset($tags['discord-bot']) || isset($tags['discordjs']) || isset($tags['discord-js']) => 'discord-bot',
            isset($tags['nodejs']) || isset($tags['node-js']) => 'nodejs',
            isset($tags['static-website']) || isset($tags['static-web']) || isset($tags['website-static']) => 'static-website',
            isset($tags['python-app']) || isset($tags['python']) => 'python-app',
            isset($tags['web-app']) || isset($tags['website']) || isset($features['service.http']) => 'web-app',
            default => 'generic-server',
        };
    }

    public function banner(string $category): string
    {
        return '/brand/banners/'.match ($category) {
            'minecraft-bedrock' => 'minecraft',
            'static-website' => 'web-app',
            default => $category,
        }.'.webp';
    }

    public function icon(string $category): string
    {
        return '/brand/workloads/'.$category.'.svg';
    }
}
