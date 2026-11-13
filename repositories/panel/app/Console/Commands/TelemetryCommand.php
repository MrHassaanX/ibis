<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Services\Telemetry\TelemetryCollectionService;
use Symfony\Component\VarDumper\VarDumper;

#[Description('Displays the data that would be sent to the configured upstream telemetry service if enabled.')]
#[Signature('p:telemetry')]
class TelemetryCommand extends Command
{
    /**
     * Handle execution of command.
     */
    public function handle(TelemetryCollectionService $telemetryCollectionService): void
    {
        $this->output->info('Collecting telemetry data, this may take a while...');

        VarDumper::dump($telemetryCollectionService->collect());
    }
}
