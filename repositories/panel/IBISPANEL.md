# IbisPanel: Panel foundation

IbisPanel is independent hosting management software, not a hosting provider. This repository preserves Pterodactyl Panel `v2.0.0-beta.2` as its Phase 0 foundation. The inherited README, identifiers, UI, authentication, authorization, APIs, schema migrations, extensions, themes and server behavior are unchanged.

The imported application was written by Pterodactyl's authors and contributors. See `LICENSE.md`, `NOTICE`, and `UPSTREAM.md`. The existing IbisPanel MIT `LICENSE` is retained separately. Phase 0 IbisPanel work consists of source integration, provenance and documentation, not a rewritten application.

Development uses the inherited Laravel/React/Vite architecture and Composer/npm locks. PHP `^8.3`, Composer 2 and Node >=22.12 are declared; use the upstream CI matrix and check resolved platform requirements. See [development setup](https://github.com/IbisPanel/docs/blob/main/development-setup.md), [architecture](https://github.com/IbisPanel/docs/blob/main/architecture.md) and [contribution guidance](https://github.com/IbisPanel/docs/blob/main/CONTRIBUTING.md). Keep the original `CONTRIBUTING.md` for upstream conventions.

The selected companion daemon is Wings `v1.13.3`. Compatibility is supported by upstream documentation; local runtime tests are pending. This is an imported beta baseline, not a production release. No new workload features, migrations, UI redesign, dependency updates or rebranding were implemented. No deployment or remote push occurred.
