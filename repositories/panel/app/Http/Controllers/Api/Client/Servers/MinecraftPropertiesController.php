<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Contracts\Files\ReadsFileContents;
use Pterodactyl\Contracts\Files\WritesFileContents;
use Pterodactyl\Enum\Permissions;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\MinecraftPropertiesFile;
use Pterodactyl\Services\Servers\ServerCapabilities;

#[Group('Client API', 'Endpoints authenticated as a panel user using a client API token.')]
#[Subgroup('Minecraft Properties', 'Read and update the configured Java server properties file.')]
class MinecraftPropertiesController extends ClientApiController
{
    #[Endpoint('Read Minecraft properties', 'Read the configured server.properties file through Wings.')]
    #[ScribeResponse(['path' => '/server.properties', 'content' => "motd=A Minecraft Server\n", 'hash' => 'd63c1c96842f261e9f0e57784ddf3317e7d25db8a7b3a60ef66304f1166197e2'], description: 'Current file contents and revision hash.')]
    public function show(Request $request, Server $server, ServerCapabilities $capabilities, MinecraftPropertiesFile $files, ReadsFileContents $reader): JsonResponse
    {
        throw_unless($request->user()->can(Permissions::FileReadContent->value, $server), AuthorizationException::class);
        $path = $this->path($server, $capabilities, $files);
        $content = $reader->read($server, $path);
        Activity::event('server:file.read')->property('file', $path)->log();

        return new JsonResponse(['path' => $path, 'content' => $content, 'hash' => hash('sha256', $content)]);
    }

    #[Endpoint('Update Minecraft properties', 'Write the configured server.properties file only if it has not changed since it was loaded.')]
    #[ScribeResponse(['path' => '/server.properties', 'hash' => 'd63c1c96842f261e9f0e57784ddf3317e7d25db8a7b3a60ef66304f1166197e2'], description: 'Saved revision hash.')]
    public function update(Request $request, Server $server, ServerCapabilities $capabilities, MinecraftPropertiesFile $files, ReadsFileContents $reader, WritesFileContents $writer): JsonResponse
    {
        throw_unless($request->user()->can(Permissions::FileUpdate->value, $server), AuthorizationException::class);
        $validated = $request->validate([
            'content' => ['present', 'string', 'max:1048576'],
            'original_hash' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/D'],
        ]);
        $path = $this->path($server, $capabilities, $files);
        $current = $reader->read($server, $path);

        if (! hash_equals(hash('sha256', $current), $validated['original_hash'])) {
            return new JsonResponse(['message' => 'The file changed on the server. Reload it before saving.'], Response::HTTP_CONFLICT);
        }

        if ($current !== $validated['content']) {
            $writer->write($server, $path, $validated['content']);
            Activity::event('server:file.write')->property('file', $path)->log();
        }

        return new JsonResponse(['path' => $path, 'hash' => hash('sha256', $validated['content'])]);
    }

    private function path(Server $server, ServerCapabilities $capabilities, MinecraftPropertiesFile $files): string
    {
        $capabilities->require($server, ServerCapabilities::MINECRAFT_PROPERTIES);
        $path = MinecraftPropertiesFile::pathForEgg($server->egg);
        abort_if($path === null, Response::HTTP_NOT_FOUND, 'No supported properties file is configured for this Egg.');
        abort_unless($files->isRegularFile($server, $path), Response::HTTP_NOT_FOUND, 'The configured server.properties file was not found or is a symbolic link.');

        return $path;
    }
}
