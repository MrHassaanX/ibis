# Validation, backup and recovery design

No migration or recovery has been performed. This is the required design for later implementation.

## Before staging

Obtain a consistent, encrypted source backup: Panel database; application source/version and environment including the original encryption key; node configs and credentials; server files/volumes and ownership; workload DB exports and version/grants; local/S3 backup inventory and keys; TLS/proxy and network mappings. Store secret material separately from redacted reports. Keep a verified immutable copy outside the source host.

Record engine-native snapshot/export commands appropriate to each actual source DB and storage backend. Check available capacity for staged copies and archives. Restore representative users, encrypted fields, files, a workload database and a backup into an isolated environment. An archive that has not been read and restored is not evidence of recoverability. Missing key or failed restoration blocks apply.

## Reconcile before cutover

Verify entity counts, uniqueness, foreign-key relationships, owner/subuser mappings, denied/allowed permissions, address/port conflicts, Egg schema validation, file hashes/size/ownership and workload DB row counts or engine-appropriate consistency checks. Detect drift from the approved dry-run snapshot. Re-run final discovery under the planned quiescence window if the source changed.

Prevent destination workers from provisioning, emailing users or starting workloads during staging. Before cutover take a final checkpoint, stop source writers and competing workload controllers, and apply only reviewed target changes. Rebind daemon ownership and secrets deliberately; validate console, files, SFTP, startup/stop, schedule behavior, database connections and backup restore. Monitor through the agreed observation period.

## Recover by checkpoint

- Before target mutation: discard only run-owned staging data; source remains authoritative.
- During staging: keep source authoritative, stop target tasks, restore or rebuild staging from the matching snapshot, and report the failed entity/checkpoint.
- After cutover but before new target writes: fence target controllers, restore the original source controller/config and matching DB/data snapshot, then verify source health before resuming service.
- After target writes: stop both sides and assess divergence. Preserve post-cutover data separately. Require a new reconciliation/recovery plan; do not overwrite source with an older snapshot without accounting for newer writes.

Use a durable journal with idempotency keys and entity ID mappings. A resumed run must verify the plan hash and checkpoint before continuing. Do not promise automatic reversal of schema changes, external API mutations or live workload data writes. Record manual recovery requirements and evidence. Only an operator's explicit completion decision should retire source infrastructure or expire backups in a future implementation; Phase 0 deletes nothing.
