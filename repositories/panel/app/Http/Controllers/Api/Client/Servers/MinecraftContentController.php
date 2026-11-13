<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\QueryParam;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Enum\Permissions;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Minecraft\MinecraftContentService;

#[Group('Client API', 'Endpoints authenticated as a panel user using a client API token.')]
#[Subgroup('Minecraft Content', 'Discover and manage compatible Modrinth server jars.')]
class MinecraftContentController extends ClientApiController
{
    #[Endpoint('Search Minecraft content', 'Search compatible server-side plugins or mods for the administrator-verified server profile.')]
    #[QueryParam('query', 'string', 'Search text.', required: false, example: 'LuckPerms')]
    #[QueryParam('offset', 'integer', 'Result offset.', required: false, example: 0)]
    #[ScribeResponse(['hits' => [['id' => 'Vebnzrzj', 'title' => 'LuckPerms', 'description' => 'A permissions plugin.', 'icon_url' => null, 'author' => 'lucko']], 'total' => 1, 'offset' => 0])]
    public function search(Request $request, Server $server, string $type, MinecraftContentService $content): JsonResponse
    {
        $this->read($request, $server);
        $values = $request->validate(['query' => ['nullable', 'string', 'max:100'], 'offset' => ['nullable', 'integer', 'min:0', 'max:10000']]);

        return new JsonResponse($content->search($server, $type, $values['query'] ?? '', (int) ($values['offset'] ?? 0)));
    }

    #[Endpoint('List compatible Minecraft releases', 'List releases matching the verified Minecraft version and software loader.')]
    #[ScribeResponse(['project' => ['id' => 'Vebnzrzj', 'title' => 'LuckPerms', 'description' => 'A permissions plugin.', 'icon_url' => null, 'license' => 'MIT License', 'url' => 'https://modrinth.com/plugin/luckperms'], 'versions' => [['id' => 'b0mk8uS6', 'name' => 'v5.5.71 (Bukkit)', 'version_number' => 'v5.5.71-bukkit', 'version_type' => 'release', 'date_published' => '2026-08-06T19:40:10Z', 'dependencies' => [['type' => 'required', 'project_id' => 'P7dR8mSH', 'version_id' => null]]]]])]
    public function versions(Request $request, Server $server, string $type, string $project, MinecraftContentService $content): JsonResponse
    {
        $this->read($request, $server);

        return new JsonResponse($content->versions($server, $type, $project));
    }

    #[Endpoint('Inspect a Minecraft release', 'Return selected file, checksum, license, and dependencies before installation.')]
    #[ScribeResponse(['project' => ['id' => 'Vebnzrzj', 'title' => 'LuckPerms', 'license' => 'MIT License'], 'version' => ['id' => 'b0mk8uS6', 'name' => 'v5.5.71 (Bukkit)', 'channel' => 'release'], 'file' => ['name' => 'LuckPerms-Bukkit-5.5.71.jar', 'size' => 1501521, 'sha512' => '0123456789abcdef'], 'dependencies' => [['type' => 'required', 'project_id' => 'P7dR8mSH', 'version_id' => null]], 'warning' => 'Third-party jars execute code inside your Minecraft server.'])]
    public function release(Request $request, Server $server, string $type, string $project, string $version, MinecraftContentService $content): JsonResponse
    {
        $this->read($request, $server);
        $result = $content->release($server, $type, $project, $version);

        return new JsonResponse([
            'project' => ['id' => $project, 'title' => $result['project']['title'] ?? '', 'license' => $result['project']['license']['name'] ?? $result['project']['license']['id'] ?? 'Unknown'],
            'version' => ['id' => $version, 'name' => $result['version']['name'] ?? '', 'channel' => $result['version']['version_type'] ?? ''],
            'file' => ['name' => $result['file']['filename'], 'size' => $result['file']['size'] ?? null, 'sha512' => $result['file']['hashes']['sha512'] ?? null],
            'dependencies' => $result['dependencies'],
            'warning' => 'Third-party jars execute code inside your Minecraft server. A restart is required after installation.',
        ]);
    }

    #[Endpoint('List managed Minecraft installations', 'Verify tracked jar files and return their installation states.')]
    #[ScribeResponse(['data' => [['id' => 1, 'project_id' => 'Vebnzrzj', 'version_id' => 'b0mk8uS6', 'filename' => 'ibis-modrinth-Vebnzrzj-b0mk8uS6.jar', 'state' => 'installed', 'sha512' => '0123456789abcdef', 'file_status' => 'verified', 'error' => null, 'update_available' => false, 'latest_version_id' => 'b0mk8uS6']]])]
    public function installed(Request $request, Server $server, string $type, MinecraftContentService $content): JsonResponse
    {
        $this->read($request, $server);

        return new JsonResponse(['data' => $content->installed($server, $type)]);
    }

    #[Endpoint('Install or update Minecraft content', 'Queue a compatible release while the server is stopped.')]
    #[BodyParam('project_id', 'string', 'Modrinth project identifier.', required: true, example: 'Vebnzrzj')]
    #[BodyParam('version_id', 'string', 'Modrinth release identifier.', required: true, example: 'b0mk8uS6')]
    #[ScribeResponse(['installation' => ['id' => 1, 'state' => 'queued']], status: 202)]
    public function install(Request $request, Server $server, string $type, MinecraftContentService $content): JsonResponse
    {
        throw_unless($request->user()->can(Permissions::FileCreate->value, $server), AuthorizationException::class);
        $values = $request->validate([
            'project_id' => ['required', 'string', 'regex:/^[A-Za-z0-9]{8,24}$/D'],
            'version_id' => ['required', 'string', 'regex:/^[A-Za-z0-9]{8,24}$/D'],
        ]);
        $existing = \Illuminate\Support\Facades\DB::table('minecraft_managed_content')->where('server_id', $server->id)->where('type', $type)->where('project_id', $values['project_id'])->first();
        if ($existing !== null) {
            throw_unless($request->user()->can(Permissions::FileUpdate->value, $server)
                && $request->user()->can(Permissions::FileDelete->value, $server), AuthorizationException::class);
        }

        return new JsonResponse(['installation' => $content->queueInstall($server, $type, $values['project_id'], $values['version_id'])], 202);
    }

    #[Endpoint('Remove managed Minecraft content', 'Delete a tracked jar only when it still matches the recorded checksum and the server is stopped.')]
    #[ScribeResponse(['removed' => true])]
    public function remove(Request $request, Server $server, string $type, int $id, MinecraftContentService $content): JsonResponse
    {
        throw_unless($request->user()->can(Permissions::FileDelete->value, $server), AuthorizationException::class);
        $content->remove($server, $type, $id);

        return new JsonResponse(['removed' => true]);
    }

    private function read(Request $request, Server $server): void
    {
        throw_unless($request->user()->can(Permissions::FileRead->value, $server), AuthorizationException::class);
    }
}
