#!/bin/sh
set -eu

image=ibispanel/node-generic:24.22.2
scratch=$(mktemp -d /tmp/ibis-node-smoke.XXXXXX)
cleanup() {
    docker rm -f ibis-node-smoke-js ibis-node-smoke-ts >/dev/null 2>&1 || true
    case "$scratch" in /tmp/ibis-node-smoke.*) rm -rf -- "$scratch" ;; esac
}
trap cleanup EXIT INT TERM

cat > "$scratch/index.js" <<'JS'
const fs = require('node:fs');
fs.writeFileSync('/home/container/persisted.txt', 'kept');
console.log('JS_STARTED');
process.on('SIGTERM', () => { console.log('JS_STOPPED'); process.exit(0); });
setInterval(() => {}, 1000);
JS
chmod 0777 "$scratch"

docker run -d --name ibis-node-smoke-js --user 1000:1000 --memory 128m --cpus 0.5 \
    --read-only --tmpfs /tmp:rw,nosuid,size=16m --network none \
    -v "$scratch:/home/container" -e MAIN_FILE=index.js "$image" >/dev/null
sleep 2
docker logs ibis-node-smoke-js 2>&1 | grep -q 'IbisPanel Node.js process ready'
docker logs ibis-node-smoke-js 2>&1 | grep -q 'JS_STARTED'
docker stop -t 5 ibis-node-smoke-js >/dev/null
test "$(docker inspect -f '{{.State.ExitCode}}' ibis-node-smoke-js)" = 0
docker logs ibis-node-smoke-js 2>&1 | grep -q 'JS_STOPPED'
test "$(cat "$scratch/persisted.txt")" = kept
docker rm ibis-node-smoke-js >/dev/null

cat > "$scratch/index.ts" <<'TS'
const result: string = 'TS_STARTED';
console.log(result);
setInterval(() => {}, 1000);
TS
docker run -d --name ibis-node-smoke-ts --user 1000:1000 --memory 128m --cpus 0.5 \
    --read-only --tmpfs /tmp:rw,nosuid,size=16m --network none \
    -v "$scratch:/home/container" -e MAIN_FILE=index.ts "$image" >/dev/null
sleep 2
docker logs ibis-node-smoke-ts 2>&1 | grep -q 'TS_STARTED'
docker stop -t 5 ibis-node-smoke-ts >/dev/null
# Node's default SIGTERM exit is 143; 137 would indicate a forced SIGKILL.
test "$(docker inspect -f '{{.State.ExitCode}}' ibis-node-smoke-ts)" = 143
docker rm ibis-node-smoke-ts >/dev/null

if docker run --rm --user 1000:1000 --read-only --tmpfs /tmp:rw,nosuid,size=16m --network none \
    -v "$scratch:/home/container" -e 'MAIN_FILE=index.js;touch /tmp/unsafe' "$image" >/dev/null 2>&1; then
    echo 'Unsafe entrypoint was accepted.' >&2
    exit 1
fi

echo 'Generic JavaScript, TypeScript, SIGTERM, persistence, and entrypoint rejection passed.'
