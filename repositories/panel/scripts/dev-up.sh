#!/usr/bin/env bash
set -euo pipefail

# Local development only. Never starts Wings, Docker, a queue worker, or servers.
panel_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
url='http://127.0.0.1:8000/auth/login'
healthy() { curl --silent --fail --output /dev/null --max-time 3 "$url"; }

if healthy; then
    echo "IbisPanel ready: $url (already running)"
    exit 0
fi

for service in mariadb redis-server; do
    if ! systemctl is-active --quiet "$service"; then
        if ! sudo -n systemctl start "$service"; then
            if [[ -t 0 ]]; then
                sudo systemctl start "$service"
            else
                echo "Could not start $service without sudo. Run this script in an interactive terminal." >&2
                exit 1
            fi
        fi
    fi
done

if ! ss -lnt '( sport = :8000 )' | grep -q ':8000'; then
    cd "$panel_dir"
    nohup php artisan serve --host=127.0.0.1 --port=8000 \
        > storage/logs/dev-server.log 2>&1 < /dev/null &
fi

for attempt in {1..12}; do
    if healthy; then
        echo "IbisPanel ready: $url"
        exit 0
    fi
    sleep 1
done

echo 'IbisPanel did not become healthy. Port 8000 may belong to another process.' >&2
ss -lntp '( sport = :8000 )' >&2 || true
echo "Check $panel_dir/storage/logs/dev-server.log" >&2
exit 1
