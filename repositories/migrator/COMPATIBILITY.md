# Migration compatibility research

Research date: 2026-11-02. This is evidence for design, not a tested support matrix. Production schemas and APIs were not accessed. Pin exact source release/commit and inspect its migrations/API in Phase 1 before implementing any adapter. Current documentation may change independently of tagged software.

## Pterodactyl

The target baseline's `app/Data/EggImportData.php` accepts PTDL_v1/v2; its models/actions use tags, and its legacy schema/migrations are retained. Do not treat a 1.x database dump as an already valid 2.0 database. The official [2.0 upgrade guide](https://docs.pterodactyl.io/v2/upgrading/upgrading-from-v1) requires Panel 1.12.0 or newer and warns against using the old `p:upgrade` path. Check the [release](https://github.com/pterodactyl/panel/releases/tag/v2.0.0-beta.2) and concrete source version before planning an upgrade. Preserve encrypted data only with a validated key strategy; losing or regenerating APP_KEY can make it unrecoverable. Existing Wings compatibility does not prove schema or extension compatibility.

Proposed profiles: separate versioned 1.x and exact 2.0 baselines. Use the target's supported import behavior or an isolated documented upgrade path when proven. Never run migrations on the source as part of a dry-run. Assess source add-ons separately.

## Reviactyl

The [official release history](https://github.com/reviactyl/panel/releases) documents a v26 rewrite using Laravel 13, React 19, Filament and Vite, independent Agent support, OAuth/registration and additional DB engines. It also changes an Egg `banner` field to `image`; later releases add passkeys. These are reasons to version adapters independently rather than copy a Pterodactyl schema.

Proposed treatment: identify older 2.x versus v26 releases and the actual agent; map user authentication and fields explicitly; validate DB dialect and permissions. Require an explicit credential reset/re-enrollment decision for unsupported OAuth/passkey/MFA records. Extension/theme packages and Agent-specific features are manual exclusions until target compatibility is demonstrated. No Reviactyl schema has been certified here.

## Pelican Panel

The official [Pterodactyl-to-Pelican migration guide](https://pelican.dev/docs/guides/migrating-from-pterodactyl/) describes a forward, in-place upgrade from Pterodactyl >=1.11.4. It turns nests/locations into tags, removes related API endpoints and changes administrative roles. That guide is not a reverse migration guarantee. The [project docs](https://pelican.dev/docs/) identify an independently developed panel and Wings.

Proposed treatment: build explicit reverse mappings for the selected Pelican version, inspect backup drivers, daemon additions and permissions, and validate Egg export versions. Unsupported roles/plugins/features require a loss report. Do not copy its application code into the MIT target; this research imports no Pelican implementation. Preserve customer data and its applicable terms separately from source code.

## PufferPanel

Official [3.0 release notes](https://docs.pufferpanel.com/en/3.x/release-notes/3.0.0.html) describe conditional template operators, different execution environments, revised permissions and a basic archive backup system. [Configuration documentation](https://docs.pufferpanel.com/en/3.x/guides/config.html) distinguishes panel DB dialects, per-node credentials and configurable server/backup storage roots. Templates and native node configuration are not Pterodactyl Eggs or Wings configuration.

Proposed treatment: identify 2.x/3.x and each server's execution environment. Convert only reviewed, representable template behavior to an Egg in a later phase; report untranslatable conditions/operators and host-executed workloads. Recreate target nodes/allocations and users through explicit mappings. Discover workload databases independently rather than assume Panel-style provisioning metadata. Archive format and restore verification are required before importing backup references.

## Adapter readiness gates

For each exact profile, collect anonymized fixtures containing users/roles, nodes, server definitions, network assignments, authentication variants, DB metadata, storage and backup manifests. Inspect actual schema migration versions and API responses; compare field types, nullability, encodings, encryption, constraints and custom tables. Build reversible staging/recovery tests before claiming support. Unknown plugins, absent encryption keys, insufficient backups, filesystem escapes and unresolved port collisions are blockers to apply, not reasons for lossy silent defaults.
