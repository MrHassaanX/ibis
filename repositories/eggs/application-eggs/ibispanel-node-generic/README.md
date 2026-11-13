# IbisPanel Node.js Generic Egg

This maintained Egg starts JavaScript and erasable TypeScript scripts, workers, and bots on Node.js 24.22.2. It is derived from the supplied Pterodactyl Node.js Generic Egg attributed to `parker@parkervcp.com`. The original definition remains in `generic-eggs/nodejs/`; this Egg replaces its unsafe startup and credential handling rather than modifying the upstream file.

## Install and start

Build the runtime image on the Wings host with `docker build -t ibispanel/node-generic:24.22.2 .` and import `egg-ibispanel-node-generic.json` through the Panel's Egg importer. The Egg carries the `nodejs` tag. Its fixed image entrypoint reads validated environment variables directly, so an Egg variable never becomes shell source.

Leave **Git repository URL** empty to upload files through File Manager or the existing Git importer. Optionally provide a public GitHub HTTPS repository and branch to clone into an empty server directory at installation. Credential-bearing URLs and non-GitHub hosts are rejected. Private repositories require a separate, approved credential flow; this Egg does not persist tokens. A nonempty server directory is never overwritten by the installer.

The installer runs dependencies once: `auto` uses `npm ci` when `package-lock.json` exists and `npm install` otherwise; `ci`, `install`, and `skip` are explicit choices. It does not build the application or reinstall packages at every restart. The npm cache lives under the server directory, which Wings makes writable for the container UID. If source arrives after initial installation, run dependency installation intentionally inside the isolated server environment.

Set **Main file** to a relative `.js`, `.cjs`, `.mjs`, `.ts`, `.cts`, or `.mts` file. TypeScript uses Node.js 24's type-stripping support; constructs requiring compilation, such as enums or JSX, need a project build first. The entrypoint is resolved inside `/home/container` and must be a regular file. Wings marks the process Running after the launcher has validated the entrypoint and is about to replace itself with Node; a subsequent crash changes state to Offline. `tini` runs as PID 1, forwards the Egg's `^SIGTERM` stop signal to Node, and reaps children. Applications can also handle SIGTERM for their own cleanup.

Automatic Git update is off by default. Opting in allows only a credential-free public GitHub HTTPS origin and `git pull --ff-only`; changed dependencies still require a deliberate install. The Egg does not log environment values or Git credentials. Wings applies the configured memory, CPU, disk, and nonroot UID limits.

Use **IbisPanel Node.js Web** for HTTP apps, Next.js production, and static web servers. The Generic Egg does not claim web readiness merely because the Node process exists. For Vite/React, build the project separately, then serve its static output through an HTTP workload. No Node 22 image is offered until its runtime and shutdown behavior are verified.
