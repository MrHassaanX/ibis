#!/usr/bin/env bash
set -euo pipefail

# Opt-in local worker. It cannot consume the standard notification/job backlog.
panel_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$panel_dir"

exec 9>storage/framework/ibis-content-worker.lock
if ! flock -n 9; then
    echo 'A Minecraft content worker is already running for this checkout.' >&2
    exit 1
fi

echo 'Serving only the minecraft-content queue. Press Ctrl+C to stop.'
exec php artisan queue:work redis_minecraft_content \
    --queue=minecraft-content --sleep=1 --tries=1 --timeout=180 --max-jobs=100
