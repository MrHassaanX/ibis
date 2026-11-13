<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\ImportGitRepositoryRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\InspectGitRepositoryRequest;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Files\GitHubRepositoryImporter;

#[Group('Client API')]
#[Subgroup('Server Files')]
class GitRepositoryController extends ClientApiController
{
    #[Endpoint('Inspect public GitHub repository', 'Lists branches and the default branch for a public GitHub repository.')]
    public function inspect(InspectGitRepositoryRequest $request, GitHubRepositoryImporter $importer, Server $server): JsonResponse
    {
        return response()->json($importer->inspect($request->string('url')->toString()));
    }

    #[Endpoint('Import GitHub snapshot', 'Copies a bounded snapshot of a public repository into a new server directory. Does not execute code.')]
    public function import(ImportGitRepositoryRequest $request, GitHubRepositoryImporter $importer, Server $server): JsonResponse
    {
        $destination = $request->string('destination')->toString();
        $result = $importer->import($server, $request->string('url')->toString(), $request->string('branch')->toString(), $destination);
        Activity::event('server:file.git-import')->property('destination', $destination)->property('commit', $result['commit'])->log();

        return response()->json($result);
    }
}
