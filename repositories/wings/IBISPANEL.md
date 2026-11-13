# IbisPanel: Wings foundation

This is IbisPanel's independent source repository for Wings, imported unchanged from official Pterodactyl Wings `v1.13.3`. No daemon behavior, protocol, internal names, module path, container handling, SFTP, filesystem or backup implementation was changed.

The [official Panel 2.0 requirements](https://docs.pterodactyl.io/v2/panel/requirements) identify Wings 1.13.2 and 1.13.3 as tested. This selects 1.13.3 alongside the Panel `v2.0.0-beta.2` foundation. Local integration verification remains pending; do not infer compatibility with every modified daemon or panel.

Build on Linux with the Go versions in `go.mod`: Go 1.24.0, toolchain go1.24.1. Preserve `go.mod` and `go.sum`. Run module verification, tests, vet, build and disposable Docker node smoke tests before a release. No dependencies were installed and no daemon was built or run in Phase 0.

Read `UPSTREAM.md`, `NOTICE`, and `LICENSE.upstream`. The root IbisPanel `LICENSE` was preserved. Shared [architecture and development instructions](https://github.com/IbisPanel/docs) cover contributions and future security updates. Independent daemon enhancements are deferred until protocol regression coverage exists.
