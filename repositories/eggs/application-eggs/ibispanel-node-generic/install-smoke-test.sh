#!/bin/sh
set -eu

scratch=$(mktemp -d /tmp/ibis-node-install.XXXXXX)
cleanup() {
    case "$scratch" in /tmp/ibis-node-install.*) rm -rf -- "$scratch" ;; esac
}
trap cleanup EXIT INT TERM
chmod 0777 "$scratch"
image=node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
script=$(dirname "$0")/install.sh

if docker run --rm --network none -v "$scratch:/mnt/server" -v "$script:/install.sh:ro" \
    -e 'GIT_ADDRESS=https://github.com/example/repo;echo unsafe' "$image" sh /install.sh >/dev/null 2>&1; then
    echo 'Unsafe Git URL was accepted.' >&2
    exit 1
fi
test -z "$(ls -A "$scratch")"

if docker run --rm --network none -v "$scratch:/mnt/server" -v "$script:/install.sh:ro" \
    -e GIT_BRANCH=unsafe "$image" sh /install.sh >/dev/null 2>&1; then
    echo 'Branch without repository was accepted.' >&2
    exit 1
fi

cat > "$scratch/package.json" <<'JSON'
{"name":"ibis-node-install-smoke","version":"1.0.0","private":true}
JSON
cat > "$scratch/package-lock.json" <<'JSON'
{"name":"ibis-node-install-smoke","version":"1.0.0","lockfileVersion":3,"requires":true,"packages":{"":{"name":"ibis-node-install-smoke","version":"1.0.0"}}}
JSON
docker run --rm --network none -v "$scratch:/mnt/server" -v "$script:/install.sh:ro" \
    -e NPM_INSTALL_MODE=auto "$image" sh /install.sh >/dev/null
test -f "$scratch/package-lock.json"

echo 'Installer rejected unsafe Git values and completed locked npm ci.'
