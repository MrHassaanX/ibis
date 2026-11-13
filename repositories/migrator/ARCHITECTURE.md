# Modular Migration Hub

Status: design only, 2026-11-02.

## Components and contracts

A coordinator owns the migration state machine and never assumes a shared database schema. Source adapters expose conceptual operations: identify product/version/capabilities; discover entities read-only; export a normalized inventory; describe mappings and losses; validate source snapshots; and supply source-specific recovery requirements. A target adapter handles IbisPanel's exact pinned schema/API. File, database and backup transfer modules are separate from identity/metadata conversion. No interface stubs are implemented in Phase 0.

Adapter selection uses explicit product and version/schema fingerprints, not branding alone. Include separate profiles for Pterodactyl 1.x and 2.x, Reviactyl release families, Pelican releases and PufferPanel 2.x/3.x. A plugin or local schema difference may require a new profile even if the displayed version matches. Unknown versions are unsupported until inspected and tested with anonymized fixtures.

The normalized inventory records source IDs/UUIDs, ownership/relationships, provenance, capabilities, storage locators, secret references and conversion status. Use a durable source-to-target ID map; never assume equal numeric IDs. Separate portable data from source-specific extensions. Record unsupported and manual entities with reasons, counts, severity and required operator decisions. Unmapped privileged permissions must default to denied.

## Lifecycle

Discovery -> dry-run plan -> validation -> verified backup checkpoint -> isolated staging -> reconciliation -> controlled cutover -> observation -> completion. Any failed gate stops progression. Dry-run performs reads and may create local redacted analysis reports; it must not change source/target APIs, register nodes, execute Egg scripts, restore files or apply SQL. A later apply must be tied to the exact plan hash, source snapshot and version; reject stale plans.

Staging writes to an isolated target with outbound jobs, email, provisioning and automatic server starts disabled. Quiesce source writers for a consistent final snapshot. Reconcile staged entities and file/database checksums before transferring daemon ownership. Only one panel/daemon may control a workload at cutover. Keep the source and checkpoints recoverable through the observation window.

## Entity mapping plan

| Entity | Required treatment |
| --- | --- |
| Users | Map stable IDs and unique emails; inspect hash algorithms and target support; require password reset when incompatible; never guess MFA/OAuth/passkey semantics or escalate privileges |
| Nodes | Map addresses/TLS/proxy/storage settings; validate daemon capability; issue target credentials securely at cutover; do not copy unrelated agent tokens |
| Servers | Preserve UUID/ownership where safe; map limits, image, startup and environment; resolve collision and permission conflicts before apply; avoid reinstalling existing files |
| Eggs/templates | Preserve authors/licenses and versioned metadata; validate PTDL conversions through target; represent unsupported PufferPanel operators as manual blockers rather than fabricating equivalent shell commands |
| Allocations | Inventory IP/port/protocol/node associations; reserve target ports; identify conflicts and external NAT/routing requirements; do not open arbitrary firewall rules |
| Configurations | Map supported fields explicitly; separate secrets; report custom extensions/themes, schedules and permissions that lack equivalents |
| Files | Copy into target-owned staging; preserve required modes/ownership with explicit UID mapping; restrict paths and symlinks; inventory hashes and sizes; prevent path traversal and cross-server leaks |
| Databases | Separate Panel metadata from workload DB data; discover engines/versions/charset/users/grants; use engine-native consistent exports; verify restore and connection remapping |
| Backups | Inventory local/S3 locations, formats, ownership, encryption and checksums; import only verified formats; retain unsupported archives externally with restore instructions, never claim a copied file is a usable target backup |

Relationships must be recreated in dependency order: identities and policy mappings; node/location/tag mapping; workload definitions; servers and allocations; database metadata; files/database data; verified backup references; finally schedules/subusers and runtime activation. Reset or revoke API/session/node credentials unless a specific secure transfer is supported. Do not put keys in the normalized report.

## Reports and completion criteria

Reports contain run ID, adapter/version, source fingerprint, target pin, plan hash, snapshot IDs, entity counts by status, collisions, unsupported fields, credential rotation status, backup/restore evidence, validation results, downtime and recovery instructions. Use machine-readable JSON plus a concise human summary in the later implementation. Store private details under access control; public examples must use synthetic data.

Completion requires matched reconciled counts/relationships, tested login/permissions, daemon and workload health checks, restored workload DB connectivity and a representative backup restore. Partial success must remain visible. A migration with unresolved required data is not complete. See `RECOVERY.md` for checkpoints and recovery.
