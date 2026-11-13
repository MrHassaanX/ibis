<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Unit\Services\Servers\ServerCapabilitiesTest;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Tag;
use Pterodactyl\Services\Servers\ServerCapabilities;
use Pterodactyl\Tests\TestCase;

uses(TestCase::class);

function egg(array $tags, array $features, string $name = 'Unknown'): Egg
{
    $egg = new Egg(['name' => $name, 'features' => $features]);
    $egg->setRelation('tags', new Collection(array_map(fn (string $slug): Tag => new Tag(['name' => $slug, 'slug' => $slug]), $tags)));

    return $egg;
}

function propertiesEgg(array $tags, array $features): Egg
{
    $egg = egg($tags, $features);
    $egg->config_files = json_encode(['server.properties' => ['parser' => 'properties', 'find' => []]]);

    return $egg;
}

function server(Egg $egg): Server
{
    $server = new Server;
    $server->setRelation('egg', $egg);

    return $server;
}

test('unknown egg and display names confer no capabilities', function (): void {
    $resolver = new ServerCapabilities;

    expect($resolver->forEgg(egg([], [], 'Paper')))->toBe([])
        ->and($resolver->forEgg(egg(['minecraft'], [], 'Paper')))->toBe([]);
});

test('explicit java features require the minecraft tag and content tools require a server profile', function (): void {
    $resolver = new ServerCapabilities;
    $features = ['minecraft.java', 'minecraft.properties', 'minecraft.plugins'];

    expect($resolver->forEgg(egg([], $features)))->toBe([])
        ->and($resolver->forEgg(propertiesEgg(['minecraft'], $features)))->toBe([
            ServerCapabilities::MINECRAFT_JAVA,
            ServerCapabilities::MINECRAFT_PROPERTIES,
        ]);
});

test('a Minecraft tag and a verified Java properties parser enable the editor without changing imported Eggs', function (): void {
    $resolver = new ServerCapabilities;

    expect($resolver->forEgg(propertiesEgg(['minecraft'], [])))->toBe([
        ServerCapabilities::MINECRAFT_JAVA,
        ServerCapabilities::MINECRAFT_PROPERTIES,
    ])->and($resolver->forEgg(propertiesEgg(['minecraft', 'bedrock'], [])))->toBe([]);
});

test('bedrock metadata cannot enable java plugin or mod tools', function (): void {
    $resolver = new ServerCapabilities;

    expect($resolver->forEgg(egg(['minecraft', 'bedrock'], [
        'minecraft.bedrock', 'minecraft.java', 'minecraft.properties', 'minecraft.plugins', 'minecraft.mods',
    ])))->toBe([ServerCapabilities::MINECRAFT_BEDROCK]);
});

test('service capabilities do not imply minecraft support', function (): void {
    $resolver = new ServerCapabilities;

    expect($resolver->forEgg(egg(['voice'], ['service.http', 'minecraft.java', 'minecraft.mods'])))->toBe([ServerCapabilities::SERVICE_HTTP]);
});

test('backend guard denies unsupported operations', function (): void {
    $resolver = new ServerCapabilities;
    $server = server(egg([], [], 'Node.js HTTP'));

    expect(fn () => $resolver->require($server, ServerCapabilities::MINECRAFT_MODS))
        ->toThrow(AuthorizationException::class);
});

test('backend guard permits an explicitly supported Java operation', function (): void {
    $resolver = new ServerCapabilities;
    $server = server(egg(['minecraft'], ['minecraft.java', 'minecraft.plugins']));

    $resolver->require($server, ServerCapabilities::MINECRAFT_JAVA);

    expect($resolver->supports($server, ServerCapabilities::MINECRAFT_JAVA))->toBeTrue()
        ->and($resolver->supports($server, ServerCapabilities::MINECRAFT_PLUGINS))->toBeFalse();
});
