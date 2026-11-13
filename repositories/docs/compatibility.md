# Compatibility and release gates

## Established versus pending

| Contract | Evidence | Phase 0 conclusion |
| --- | --- | --- |
| Panel baseline | Official `v2.0.0-beta.2` tag and exact source blobs | Preserved source, beta status |
| Wings pairing | [Official 2.0 requirements](https://docs.pterodactyl.io/v2/panel/requirements) name 1.13.2/1.13.3 as tested | Select 1.13.3; local runtime verification pending |
| Egg formats | `app/Data/EggImportData.php` accepts PTDL_v1 and `Egg::EXPORT_VERSION`; `app/Models/Egg.php` sets PTDL_v2 | Format compatibility only, not a workload installation guarantee |
| Extensions/themes | Upstream services and `packages/sdk` preserved | Existing behavior retained at source level; no blanket compatibility promise for 1.x or third-party add-ons |
| APIs and migrations | Entire original routes, tests, schema and migration files retained | No IbisPanel API or schema edits |
| Broader workload support | Existing application/generic Eggs included unchanged | Domains, TLS, routing and new workload features remain planned |

All inherited identifiers, Go module paths, Composer/npm package names, URLs, telemetry behavior, marketplace integration, and branding remain as upstream. Upstream external services may still be contacted when the application runs. Review these settings and user consent before a future IbisPanel release. Source import is not permission to republish upstream release automation under IbisPanel credentials.

Before any remote push in a later phase, review inherited `.github` workflows, release triggers, branch filters, package destinations, secrets, and permissions. Panel CI currently targets `2.0-develop`, while the IbisPanel repositories use their existing default branch; merely importing workflows does not establish working IbisPanel CI. Eggs' nested workflows are archival source content and will not run from the repository root. Do not claim CI is enabled.

## Required future runtime matrix

On disposable Linux nodes test the pinned pair for token/scope authentication, rejection of invalid tokens, TLS/proxy settings, server provisioning, power actions/status, WebSocket console, file traversal protections, file upload/download, SFTP password and SSH-key authentication, schedules, allocations, resource limits, local/S3 backups and restore. Test interrupted operations and permission denial as well as happy paths. Compare results to the upstream baseline.

Import representative PTDL_v1/v2 Eggs through the real Panel validator, including game, bot and language definitions. Confirm images exist on the target CPU architecture, scripts remain licensed and reachable, variables meet validation, and no reinstall is triggered over existing server files. Static metadata inspection does not replace this gate.

## Migration research boundaries

The Migration Hub is planned, not implemented or certified. [Its compatibility research](https://github.com/IbisPanel/migrator/blob/main/COMPATIBILITY.md) separates source versions and records primary references. Pterodactyl 1.x and 2.x must be separate adapter profiles. Current Panel 2.0 uses tags; legacy nests/locations cannot be assumed to map by identical numeric IDs. Pelican's documented forward migration does not establish a reverse migration into IbisPanel. Reviactyl's independent agent and extensions require separate checks. PufferPanel templates are not Eggs and its node protocol is not Wings.

No PHP or Go dependency vulnerability audit, image scan, browser test, or end-to-end compatibility test ran. Signature trust is unresolved as described in provenance. The known Sunkenland sample asset syntax error is preserved for baseline integrity and needs a separate reviewed upstream fix if used. Panel's npm root engine metadata differs between its manifest (`>=22.12`) and lockfile (`>=22`); use the stricter version and resolve metadata separately after dependency-backed validation.
