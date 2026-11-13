<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Unit\Services\Servers\MinecraftPropertiesFileTest;

use Pterodactyl\Models\Egg;
use Pterodactyl\Services\Servers\MinecraftPropertiesFile;
use Pterodactyl\Tests\TestCase;

uses(TestCase::class);

test('uses a single administrator configured properties parser at a safe relative path', function (): void {
    $egg = new Egg(['config_files' => json_encode(['config/server.properties' => ['parser' => 'properties', 'find' => []]])]);
    expect(MinecraftPropertiesFile::pathForEgg($egg))->toBe('/config/server.properties');
});

test('rejects invalid, ambiguous and unsupported file configurations', function (array $configuration): void {
    $egg = new Egg(['config_files' => json_encode($configuration)]);
    expect(MinecraftPropertiesFile::pathForEgg($egg))->toBeNull();
})->with([
    'wrong parser' => [['server.properties' => ['parser' => 'yaml']]],
    'traversal' => [['../server.properties' => ['parser' => 'properties']]],
    'absolute' => [['/server.properties' => ['parser' => 'properties']]],
    'different file' => [['other.properties' => ['parser' => 'properties']]],
    'ambiguous' => [['server.properties' => ['parser' => 'properties'], 'config/server.properties' => ['parser' => 'properties']]],
]);
