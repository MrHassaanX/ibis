#!/bin/sh
set -eu

cd /home/container
export HOME=/home/container
export npm_config_cache=/home/container/.npm-cache

main_file=${MAIN_FILE:-index.js}
case "$main_file" in
    ''|/*|.*|*/.*|*//*|*'..'*|*[!A-Za-z0-9_./-]*)
        echo 'Invalid relative Node.js entrypoint.' >&2
        exit 2
        ;;
esac

case "$main_file" in
    *.js|*.cjs|*.mjs|*.ts|*.cts|*.mts) ;;
    *) echo 'Entrypoint must end in .js, .cjs, .mjs, .ts, .cts, or .mts.' >&2; exit 2 ;;
esac

if [ "${AUTO_UPDATE:-0}" = 1 ]; then
    if [ ! -d .git ]; then
        echo 'Automatic update requires a Git checkout.' >&2
        exit 2
    fi
    origin=$(git remote get-url origin 2>/dev/null || true)
    case "$origin" in
        *'..'*|*[!A-Za-z0-9_./:-]*) echo 'Automatic update requires a credential-free public GitHub origin.' >&2; exit 2 ;;
    esac
    if ! printf '%s' "$origin" | grep -Eq '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(\.git)?$'; then
        echo 'Automatic update requires a public GitHub HTTPS origin without credentials.' >&2
        exit 2
    fi
    GIT_TERMINAL_PROMPT=0 git pull --ff-only --quiet
elif [ "${AUTO_UPDATE:-0}" != 0 ]; then
    echo 'AUTO_UPDATE must be 0 or 1.' >&2
    exit 2
fi

resolved=$(realpath -e -- "/home/container/$main_file" 2>/dev/null || true)
case "$resolved" in
    /home/container/*) ;;
    *) echo 'Entrypoint must be an existing file inside the server directory.' >&2; exit 2 ;;
esac
if [ ! -f "$resolved" ]; then
    echo 'Node.js entrypoint is not a regular file.' >&2
    exit 2
fi

echo 'IbisPanel Node.js process ready'
case "$main_file" in
    *.ts|*.cts|*.mts) exec /usr/local/bin/node --experimental-strip-types "$resolved" ;;
    *) exec /usr/local/bin/node "$resolved" ;;
esac
