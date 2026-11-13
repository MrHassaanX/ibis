# IbisPanel project report

Date: 2026-11-07. Scope: the seven local repositories and the private WSL development instance. This is an evidence inventory, not a release certification.

## Executive summary

IbisPanel is independent open-source hosting management software for providers, developers and self-hosters, rather than a hosting business. It began with Pterodactyl Panel 2.0.0-beta.2, compatible Wings v1.13.3 and Egg definitions. The local Panel, Wings, Docker and one Node.js/Next.js workload work together. The Africhem Globalz GitHub snapshot is running from the disposable server's private allocation. Wings now reports **running** after the Node.js HTTP Egg recognizes Next.js readiness; a direct Next.js process also stops cleanly.

The Panel contains substantial branding, administration, appearance, console, file, Minecraft-content and server-management work. Several other workload categories have artwork or inherited Eggs but no proven end-to-end installation. The installer and migration hub remain designs. The current verdict is **local testing ready**, not private/public beta or production ready: release automation, secure public HTTP routing/TLS, backup/restore, broader workload trials and operational queue supervision remain unproven.

## Origins and architecture

The original [shared documentation](../../docs/README.md) describes a free independent management panel for hosting companies and self-hosters, with game, website, app and bot workloads. Later Phase E design work adopted the navy/cyan IbisPanel visual identity, four modes and a configurable provider experience. These visual goals are separate from the original infrastructure goal. Upstream attribution and licenses remain part of the source history.

Panel (Laravel/PHP, React/TypeScript, MariaDB and Redis) owns users, permissions, server/node/port metadata and orchestration. Wings (Go) receives authenticated Panel requests, manages files, console, power and resource telemetry, and controls Docker containers. Eggs define images, startup commands, environment, install scripts and readiness signals. Docker isolates each workload; an allocation maps its private or public host port to the container. A GitHub snapshot is copied into a server volume through Wings; dependency installation, builds and process startup occur inside that workload container. The Panel's queue workers and scheduler are distinct operational services.

## Repository audit

| Repository | Local HEAD at audit | Stack and actual role | Important gap |
| --- | --- | --- | --- |
| Panel | `861a380cd043de30b49af6da4154623579ad7dd0` before this task's fixes | Laravel/PHP API, React/TypeScript/Vite UI, MariaDB/Redis, inherited SDK, client/admin flows, appearance and native features | Production operations and broad workload validation |
| Wings | `1c37ddbedebb0fe6af95c2b46e85d099847e58bd` | Go daemon, inherited v1.13.3 baseline; Docker, files, power, telemetry, WebSocket/SFTP | Independently maintained changes and regression matrix remain minimal |
| Eggs | `dcec707b220aeaf56dbcf88280f13c3ce5efc43b` before this task's fix | PTDL definitions and images/scripts; local Node.js 24 HTTP image | Most inherited Eggs are untested here; image distribution is local |
| Installer | `61649550bd87de7fc326d9f763c745941f08710a` | Architecture and manual runbook for six lifecycle operations | No executable installer/updater/repair tool |
| Migrator | `7ffb54cbb957ffd1003fd2bfd054ba47844f6e2e` | Compatibility and recovery design | No implemented adapters or live migrations |
| Docs | `222c00516bd3f1abccd2c02147a4de93aa6d8f15` | Markdown architecture, provenance, security, compatibility and Phase 0 evidence | Operational/release guidance needs validation and maintenance |
| Website | `b480b402ebd95105fc4291ba4de441726b6475e3` | Next.js public product website and preview assets | Separate from hosting runtime; deployment is not established by this audit |

The seven Git repositories were clean before the scoped Panel/Egg changes. Installer, Migrator, Docs, Website and Wings were not edited.

## Development history and evidence

| Milestone | Evidence | Result |
| --- | --- | --- |
| Phase 0 foundation | Panel `d7549cf`, Wings baseline, [Phase 0 report](../../docs/phase-0-report.md) | Imported and attributed sources; no deployment claim |
| Phase 1 branding/runtime | `b052646`, `08d4108`, `138efbc`, `9b29dac` | Local login/admin and IbisPanel branding; compatible Panel layout |
| Phase 2 and 3 hosting | [Phase E.7 report](../PHASE-E7-FINAL-REPORT.md), local Wings/Docker instance | Local node, private allocations and disposable workload trials; not a public hosting service |
| Phase 3C native features | `4fe9adf`, `cdfbaf9`, `bd6ced1` | Loader, regions, announcements, properties, plugin/mod management code |
| Phase E appearance/console | `f0b3d10` through `efa5f08`, [E.7 status](../PHASE-E7-STATUS.md) | Four modes, editor, navigation, account/sounds, telemetry, artwork and responsive checks |
| Phase M attempt/removal | `4c642c8`, `5c265e8`, `09bad43`, [M status](../PHASE-M-STATUS.md) | Read-only SoftwareCatalog/planner were committed, then intentionally removed. Installation/switching was never enabled |
| Branding cleanup | `e1f3d7d` | Product naming cleanup with compatible inherited protocol IDs retained |
| Git importer | `861a380`; real 150-file Africhem snapshot import | Public GitHub snapshot workflow; no Git history/pull/deploy |
| Node.js/Next.js | Eggs `dcec707`; this task's hosting fix | Node 24.22.2 and Next 16.3.7 build/start on private port; Windows HTTP confirmed |

Older status documents describe their own checkpoints; their “pending” lists are not automatically current. The current M status confirms the planner was removed. Neither source presence nor a UI screen proves production readiness.

## Feature inventory

| Feature | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| Login, accounts, RBAC, admin/server API | Partial | Live admin login and inherited tests; E.7 account tests | Security/release audit and full permission matrix |
| Provider name/logo, four appearance modes | Partial | E.6/E.7 commits and authenticated mode captures | Save/upload combinations and accessibility matrix |
| Appearance editor, loader, banners/icons | Partial | Phase 3C/E commits and browser captures | Broader browser/runtime validation |
| Dashboard, server cards and responsive navigation | Partial | E.7 screenshots at 1440/1024/768/390 | Complete interaction and assistive-tech testing |
| Console, power controls and real telemetry | Partial | E.7 tests; this task's Wings Running/Offline checks | Startup timeout and disconnect integration tests |
| Region display | Partial | `cdfbaf9`, E.7 captures | Multi-node/location acceptance testing |
| Announcements | Partial | `4fe9adf`, source/tests | Scheduling/delivery under production workers |
| Account customization, language foundation, sounds | Partial | `3353315`, E.7 report | Full translation coverage and audible hardware validation |
| File Manager and public GitHub snapshot import | Partial | `861a380`, authenticated modal, Wings Africhem files | Private repos, pull, deployment automation |
| Minecraft properties | Partial | `cdfbaf9`, focused tests | Wider Egg/version and live world validation |
| Plugin/mod manager, Modrinth and worker | Partial | `bd6ced1`, `13bf087`, E.5 status | Supervised worker, queue recovery and compatibility matrix |
| Datapacks, modpacks, player manager, startup presets, 64x64 server icon flow | Planned | M status says later milestones deferred | Separate scoped designs and tests |
| Software/version switching | Removed | `09bad43`, M status | Re-plan safe backups, transitions and rollback |
| Local Node.js and Next.js HTTP hosting | Partial | Real Africhem build, Wings state, Windows HTTP | Reusable build workflow, public URL/TLS/domain setup |
| Installer and Migration Hub | Planned | Their architecture/readmes | Executable, fault-tested implementation |

“Partial” means meaningful implementation exists but the full production capability has not been established.

## Workload evidence matrix

Columns separate definition, provisioning and actual runtime proof. “Unverified” never means incompatible.

| Workload | Egg/definition | Server creation | Install | Start | Network | End-to-end |
| --- | --- | --- | --- | --- | --- | --- |
| Minecraft Java (Paper/Fabric) | Present | Previously tested locally | Partial, EULA deliberately unaccepted | Past local process tests | Private allocation only | Partial; prior test servers archived/deleted |
| Minecraft Bedrock | Inherited Eggs present | Unverified | Unverified | Unverified | Unverified | Unverified |
| Node.js HTTP | Local Egg present | Yes, server 995 | Manual npm install | Yes | Yes, private WSL | Yes, Africhem test |
| Next.js | Uses Node.js HTTP Egg | Yes | `npm ci` and build | Next 16.3.7 ready | Windows HTTP 200 | Yes, tested pages/assets |
| React/static website | Can use HTTP workload, but no dedicated validated path | Unverified | Unverified | Unverified | Unverified | Unverified |
| Discord.js bot | Related inherited definitions/artwork | Unverified | Unverified | Unverified | Not an HTTP workload by default | Unverified |
| Python | Inherited generic Egg | Unverified | Unverified | Unverified | Unverified | Unverified |
| FiveM/Hytale | Artwork and possible inherited definitions | Unverified | Unverified | Unverified | Unverified | Unverified |
| Other Eggs | Definitions in Eggs tree | Unverified per Egg | Unverified | Unverified | Unverified | Unverified |

Africhem is imported at `/africhem-globalz-20261106` in server 995's Wings volume. Node 24.22.2, Next 16.3.7, 100% CPU, 3 GiB RAM, 4 GiB disk, private `172.20.175.81:64738`. Dependency install/build were intentional container commands, not automatic Git import actions. Startup points at that directory, binds `0.0.0.0` *inside* the container, and sets `SITE_INDEXABLE=false` and `QUOTE_FORM_ENABLED=false`. Windows GETs for /, /about, /products and /contact returned 200; missing route returned 404. Static JS/PNG succeeded in the prior test and no-index header was confirmed. No source code or runtime build files were committed.

This task fixed the status root cause: the Egg's original readiness marker matched only its fixture text, so a live Next server remained Wings `starting`. The updated Egg adds a Next `Ready in ...` marker with ANSI stripping, retains the fixture marker, and uses SIGTERM for graceful stop. A direct Next process replaces the signal-resistant `npm run start` wrapper for the local server. Wings then reported `running`; stop reached `offline`; subsequent start passed through `starting` to `running`. The frontend exposes an Open Website and Copy URL action only when the Egg declares `service.http` and the primary allocation is a usable IPv4 address. Private allocations are labeled Local Network; no public reachability or proxy/domain is inferred. The console still displays raw application stdout.

The current Next.js `NoFallbackError` was reproduced only for the deliberately nonexistent route: valid routes did not increase its count, while each 404 did. This isolates the observed message to the application's/Next.js missing-route path in this local trial; it is not suppressed or claimed resolved upstream.

### Shutdown recheck — 2026-11-07

The owner subsequently reported that STOP sometimes left the site accessible. A fresh reproduction with server 995 found Wings `running`, a single `next-server` process as container PID 1, and Windows HTTP 200 before STOP. STOP through the Panel's existing power service moved Wings to `offline`, left the Docker container `exited` with PID 0, released the private allocation, and made a fresh uncached Windows request fail to connect (curl HTTP 000). Two additional controlled start/stop cycles repeated Running/200 then Offline/connection failure without a port conflict. A subsequent restart changed the container process PID from 5525 to 5731, with the old PID absent, one listener, Wings `running` and Windows HTTP 200. The live Console's status logic is still driven by Wings state and socket connection.

These observations do **not** reproduce a persistent listener after STOP. They verify the current direct-process Egg configuration on this one server, not every Node workload or a browser-cache scenario. No runtime source or Egg was changed for this recheck. If the owner sees the site after a future STOP, capture the exact time, URL, Wings state, fresh `curl --noproxy '*' -H 'Cache-Control: no-cache'` result, container ID/PID and port owner before changing shutdown code. A browser-rendered cached page is not proof of a live server; conversely, a fresh HTTP 200 after STOP would be a real unresolved fault.

## Minecraft and application-hosting limits

Properties, plugin/mod UI, Modrinth discovery, bounded content jobs and capability checks exist. A dedicated worker is opt-in, and E.5 documented stale legacy queue entries and old notification failures; they were not replayed. The earlier Fabric artifact test covered one offline server, not a complete cross-version matrix. Datapacks/modpacks, version switching, player management, startup presets and icon-management flow are not complete. Software switching depends on exact installed-version evidence, compatibility planning, backups and rollback; the prior read-only M1 code was withdrawn.

The importer verifies a public GitHub repository/branch, downloads a bounded snapshot, validates destination/archive entries and extracts via Wings under server permissions. It is neither a clone nor an automated deploy. Private credentials, webhooks, pull/update and CI/CD are future work. Node dependency installation, build, startup command, local image build and allocation setup currently require operator work. No verified HTTPS domain or reverse proxy mapping exists. The Open Website action therefore uses the allocated private URL and does not rewrite console logs.

## Appearance, security and reliability

Ibis Legacy, Dark OLED, Light and System are implemented; E.6/E.7 captures cover key desktop/mobile views, not every combination. Workload artwork resolves from Egg metadata with server/Egg overrides. Resource cards use Wings samples, not fabricated numbers. Account settings, appearance editor and responsive sidebar have focused validation; known gaps include full accessibility, all language strings, hardware sound output and broad live-workload visual review. Server 995's stale stopped-showcase description was corrected through the Panel's existing details action.

Authorization guards, capability checks, file API boundaries, import URL/archive checks and container isolation are present in source; their broader penetration/recovery review remains outstanding. A public GitHub snapshot can contain untrusted code, and configurable startup executes that code only when an operator intentionally builds/starts it. Docker socket and Wings tokens remain privileged. Secrets were not committed. Backup/restore and migration safety lack full end-to-end recovery drills. The local image is not published; Wings logs a remote pull denial then uses its existing local image. Public port exposure, TLS, domain ownership and restart-after-host-reboot are unverified. Runtime/dependency updates require reviewed pins. Queue supervision remains a reliability prerequisite.

## Installer and Migration Hub

Installer is documentation only: Install Panel, Install Wings, Install Both, Update, Migrate, Diagnose/Repair and Plan are specified in [architecture](../../installer/ARCHITECTURE.md), without executable operations. The [Migrator](../../migrator/README.md) designs versioned Pterodactyl, Reviactyl, Pelican and PufferPanel adapters; no source profile has passed an actual data migration. Their compatibility notes are research, not a support guarantee. Each future adapter requires read-only discovery, mapping fixtures, backup verification, isolated staging and rollback.

## Readiness assessment

| Area | Current assessment |
| --- | --- |
| Panel foundation and branding | Functional local foundation; independent release hardening incomplete |
| Core hosting | Local Panel/Wings/Docker orchestration works for the tested server; operational matrix incomplete |
| Minecraft hosting | Partial, Egg/profile-specific, no broad end-to-end guarantee |
| Web/app hosting | One real Next.js/Node.js private preview validated; automation/domain/TLS incomplete |
| Discord bots | Unverified runtime |
| Git deployment | Snapshot import works; continuous deployment does not exist |
| Installer and Migrator | Design-only |
| Documentation and security | Substantial design/evidence; release and recovery audits incomplete |
| Production readiness | Not established |

**Verdict: local testing ready.** See [remaining roadmap](IBISPANEL-REMAINING-ROADMAP.md) for prioritized, testable follow-up. No arbitrary completion percentage is assigned.
