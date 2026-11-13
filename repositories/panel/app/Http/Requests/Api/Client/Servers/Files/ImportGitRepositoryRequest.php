<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

use Pterodactyl\Enum\Permissions;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Models\Server;

class ImportGitRepositoryRequest extends ClientApiRequest
{
    public function authorize(): bool
    {
        $server = $this->parameter('server', Server::class);

        return $this->user()->can(Permissions::FileRead->value, $server)
            && $this->user()->can(Permissions::FileCreate->value, $server)
            && $this->user()->can(Permissions::FileDelete->value, $server);
    }

    public function rules(): array
    {
        return [
            'url' => ['required', 'string', 'max:500'],
            'branch' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:101'],
        ];
    }
}
