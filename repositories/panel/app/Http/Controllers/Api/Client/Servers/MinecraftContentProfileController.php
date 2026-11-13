<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\MinecraftContentProfile;
use Pterodactyl\Services\Servers\ServerCapabilities;

#[Group('Client API', 'Endpoints authenticated as a panel user using a client API token.')]
#[Subgroup('Minecraft Content', 'Discover and manage compatible Modrinth server jars.')]
class MinecraftContentProfileController extends ClientApiController
{
    #[Endpoint('Get Minecraft software profile', 'Return the administrator-attested software and version for this server.')]
    #[ScribeResponse(['profile' => ['software' => 'paper', 'minecraft_version' => '1.21.11', 'loader_version' => null], 'can_configure' => true, 'eligible' => true])]
    public function show(Request $request, Server $server, MinecraftContentProfile $profiles, ServerCapabilities $capabilities): JsonResponse
    {
        $server->loadMissing('egg.tags');

        return new JsonResponse([
            'profile' => $profiles->forServer($server),
            'can_configure' => (bool) $request->user()->root_admin,
            'eligible' => in_array(ServerCapabilities::MINECRAFT_JAVA, $capabilities->forEgg($server->egg), true),
        ]);
    }

    #[Endpoint('Set Minecraft software profile', 'Administrator confirms the installed software, Minecraft version, and loader before enabling content tools.')]
    #[BodyParam('software', 'string', 'Installed Java software.', required: true, example: 'paper')]
    #[BodyParam('minecraft_version', 'string', 'Verified Minecraft version.', required: true, example: '1.21.11')]
    #[BodyParam('loader_version', 'string', 'Verified loader version for mod servers.', required: false, example: '0.20.1')]
    #[BodyParam('confirmed_installed', 'boolean', 'Administrator attestation that the installed software and version were checked.', required: true, example: true)]
    #[ScribeResponse(['profile' => ['software' => 'paper', 'minecraft_version' => '1.21.11', 'loader_version' => null]])]
    public function update(Request $request, Server $server, ServerCapabilities $capabilities, MinecraftContentProfile $profiles): JsonResponse
    {
        throw_unless($request->user()->root_admin, AuthorizationException::class);
        $server->loadMissing('egg.tags');
        abort_unless(in_array(ServerCapabilities::MINECRAFT_JAVA, $capabilities->forEgg($server->egg), true), 422, 'This Egg is not a configured Minecraft Java Egg.');

        $values = $request->validate([
            'software' => ['required', 'string', Rule::in([...MinecraftContentProfile::PLUGIN_SOFTWARE, ...MinecraftContentProfile::MOD_SOFTWARE])],
            'minecraft_version' => ['required', 'string', 'regex:/^[0-9][A-Za-z0-9.\-]{1,22}$/D'],
            'loader_version' => ['nullable', 'string', 'regex:/^[0-9][A-Za-z0-9.\-]{0,30}$/D'],
            'confirmed_installed' => ['required', 'accepted'],
        ]);
        if (MinecraftContentProfile::typeFor($values['software']) === 'mod' && empty($values['loader_version'])) {
            return new JsonResponse(['message' => 'A verified loader version is required for mod servers.'], 422);
        }
        abort_if(DB::table('minecraft_managed_content')->where('server_id', $server->id)->exists(), 409,
            'Remove or recover managed plugins and mods before changing the server software profile.');

        DB::table('minecraft_content_profiles')->upsert(
            [[
                'server_id' => $server->id,
                'software' => $values['software'],
                'minecraft_version' => $values['minecraft_version'],
                'loader_version' => $values['loader_version'] ?? null,
                'updated_at' => now(),
                'created_at' => now(),
            ]],
            ['server_id'],
            ['software', 'minecraft_version', 'loader_version', 'updated_at'],
        );

        return new JsonResponse(['profile' => $profiles->forServer($server)]);
    }

    #[Endpoint('Clear Minecraft software profile', 'Administrator clears the profile after all managed jars have been removed.')]
    #[ScribeResponse(['profile' => null])]
    public function destroy(Request $request, Server $server): JsonResponse
    {
        throw_unless($request->user()->root_admin, AuthorizationException::class);
        abort_if(DB::table('minecraft_managed_content')->where('server_id', $server->id)->exists(), 409,
            'Remove or recover managed plugins and mods before clearing the server software profile.');
        DB::table('minecraft_content_profiles')->where('server_id', $server->id)->delete();

        return new JsonResponse(['profile' => null]);
    }
}
