<?php

declare(strict_types=1);

namespace Pterodactyl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Services\Minecraft\MinecraftContentService;
use Throwable;

class MinecraftContentInstallJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 180;

    public bool $failOnTimeout = true;

    // The nullable default keeps old serialized standard-queue jobs safe to deserialize.
    public ?string $operationId = null;

    public function __construct(public int $contentId, public string $versionId, ?string $operationId = null)
    {
        $this->operationId = $operationId;
        $this->onConnection('redis_minecraft_content')->onQueue('minecraft-content');
    }

    public function handle(MinecraftContentService $content): void
    {
        if ($this->operationId !== null) {
            $content->perform($this->contentId, $this->versionId, $this->operationId);
        }
    }

    public function failed(?Throwable $error): void
    {
        if ($this->operationId === null) {
            return;
        }

        DB::table('minecraft_managed_content')
            ->where('id', $this->contentId)
            ->where('operation_id', $this->operationId)
            ->whereIn('state', ['queued', 'downloading', 'verifying', 'installing'])
            ->update(['state' => 'failed', 'error' => 'The content worker stopped before installation completed. Review Files and retry.', 'updated_at' => now()]);
    }
}
