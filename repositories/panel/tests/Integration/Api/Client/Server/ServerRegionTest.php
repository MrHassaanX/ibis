<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Client\Server\ServerRegionTest;

use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

uses(ClientApiIntegrationTestCase::class);

test('visible Sydney metadata reaches both server responses with an uppercase location code', function (): void {
    [$user, $server] = $this->generateTestAccount();
    $server->node->location->update([
        'short' => 'AU-SYD',
        'country_code' => 'AU',
        'region_name' => 'Sydney',
        'display_label' => null,
        'region_visible' => true,
    ]);

    $region = ['country_code' => 'AU', 'name' => 'Sydney', 'label' => null];
    $this->actingAs($user)->getJson('/api/client')->assertOk()->assertJsonPath('data.0.attributes.region', $region);
    $this->getJson($this->link($server))->assertOk()->assertJsonPath('attributes.region', $region);
});

test('visible incomplete metadata falls back to the stored location name without inventing a country', function (): void {
    [$user, $server] = $this->generateTestAccount();
    $location = $server->node->location;
    $location->update([
        'short' => 'CUSTOM-RACK',
        'long' => 'Custom development rack',
        'country_code' => '??',
        'region_name' => null,
        'region_visible' => true,
    ]);

    $this->actingAs($user)->getJson($this->link($server))->assertOk()
        ->assertJsonPath('attributes.region.country_code', null)
        ->assertJsonPath('attributes.region.name', 'Custom development rack');

    $location->update(['long' => null]);
    $this->getJson($this->link($server))->assertOk()->assertJsonPath('attributes.region.name', 'CUSTOM-RACK');
});

test('an administrator-hidden region remains absent from the client responses', function (): void {
    [$user, $server] = $this->generateTestAccount();
    $server->node->location->update(['country_code' => 'AU', 'region_name' => 'Sydney', 'region_visible' => false]);

    $this->actingAs($user)->getJson('/api/client')->assertOk()->assertJsonPath('data.0.attributes.region', null);
    $this->getJson($this->link($server))->assertOk()->assertJsonPath('attributes.region', null);
});
