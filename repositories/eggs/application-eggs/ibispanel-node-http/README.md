# IbisPanel Node.js Web Egg

This separately maintained PTDL_v2 Egg is tagged `nodejs` and runs an uploaded `index.js` with Node.js 24.22.2 LTS. The install script creates the server directory only. It does not clone code, run `npm install`, execute remote scripts, or interpolate startup variables into a shell command. Upload `index.js` and `message.txt` from this directory through the IbisPanel file manager before starting the server. The application uses the Wings-provided `SERVER_PORT` and binds to `0.0.0.0` inside its container.

The existing upstream generic Node.js Egg was left untouched. Its startup command quotes the `*.js` pattern, sending JavaScript files through `ts-node`; it also installs packages and can clone arbitrary repositories during installation. Those behaviors are unnecessary for this dependency-free HTTP validation fixture.

The upstream generic Egg's Wings-compatible `ghcr.io/ptero-eggs/yolks:nodejs_24` image currently contains Node.js 24.17.0. The current official Node.js 24 LTS patch is 24.22.2. The official `node:24.22.2-bookworm-slim` image starts a REPL under Wings because its inherited entrypoint ignores the Egg startup command. Therefore the local `Dockerfile` pins the official image's manifest digest `sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c` and sets a fixed, argument-free entrypoint for this fixture. Build it on the Wings host with `docker build -t ibispanel/node-http:24.22.2 .` from this directory before starting the server. The Egg's startup field records the same command. Update the image deliberately when a newer supported LTS patch is approved.

The fixture answers `GET /` with the text in `message.txt`, logs requests, and handles SIGINT/SIGTERM. It requires no credentials or external dependencies. Use a private WSL allocation; the container bind address is separate from the host-side Docker port binding.

## Optional configurable startup image

`Dockerfile.startup` provides a separate Node.js 24.22.2 image for applications that need a custom startup command. Build it on the Wings host with `docker build -f Dockerfile.startup -t ibispanel/node-http:24.22.2-startup .`, then select **Node.js 24.22.2 LTS (configurable startup)** for that server. The original fixed-entrypoint image remains the default for the simple fixture. The configurable image executes the server's Wings `STARTUP` command through a shell; administrators should configure it only for trusted server content.

The Egg installer still does not fetch source or install dependencies. For a Node.js application, import its source into the server's file area, run dependency installation and build as separate, intentional commands in the isolated server container, and set the startup command to enter the application directory and bind to the Wings-provided `${SERVER_PORT}` on `0.0.0.0`. If npm cannot write its default cache, use a cache under `/home/container` (for example, `HOME=/home/container` and `npm_config_cache=/home/container/.npm-cache`). Keep build output and dependencies in the server's runtime storage; do not commit them to the Egg repository.

Wings recognizes both the original fixture's `IbisPanel development HTTP ready` line and Next.js production's `Ready in ...ms` line (including ANSI-styled output). It marks a server running only after its configured startup output matches; a listening port alone does not change state. The Egg uses SIGTERM for graceful stop. For Next.js, prefer a direct startup such as `cd /home/container/app && exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${SERVER_PORT}`; an `npm run start` wrapper can leave the container running after Wings sends a stop signal. The directory must contain an already-built application. Keep the original fixed-entrypoint fixture available for its existing smoke test.

## Restart this local test after WSL restarts

The Phase 3A server is `ibis-phase3a-node-http` (Panel ID `5`, short ID `4a356853`, allocation port `64739`). Its files and locally built image persist in the Ubuntu WSL virtual disk. From PowerShell, start the existing services and inspect the current WSL IP:

```powershell
wsl.exe -d Ubuntu-24.04 -u root -- systemctl start docker wings
wsl.exe -d Ubuntu-24.04 -u omenh -- hostname -I
wsl.exe -d Ubuntu-24.04 -u root -- docker image inspect ibispanel/node-http:24.22.2
```

If the image is missing, rebuild it from this directory inside WSL with `docker build -t ibispanel/node-http:24.22.2 .`. Ensure the Panel's local `artisan serve` is running on `127.0.0.1:8000` (see the Phase 2B operations report in the workspace root). If the WSL private IP changed from `172.20.175.81`, add a new private allocation for port `64739` in the node's Allocation tab and reassign **only server ID 5** to it in the server's Build tab; retire the old allocation after confirming no server uses it. Check that Docker will bind the new private IP, then open `http://127.0.0.1:8000/server/4a356853` and click **Start**. Test from Windows with `curl.exe --noproxy '*' http://<current-WSL-IP>:64739/`.

The Phase 2B Mumble server (ID `4`) is unrelated and must remain stopped and unchanged. This setup is for private development; it does not configure a public listener, domain, proxy, or TLS.
