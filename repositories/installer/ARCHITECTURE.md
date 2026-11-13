# Lifecycle operation architecture

Status: design, 2026-11-02. Nothing in this document is implemented or has been executed.

## Shared pipeline

Separate discovery, preflight, plan, backup verification, apply, validation and report. Inputs are operation, target host/OS/architecture, component versions, install paths, external service choices and secret references. Discovery must not modify hosts. Produce a reviewable plan with resources changed, required privileges, downtime, backups, immutable artifact hashes and recovery steps before apply.

A platform backend handles supported Linux packages, services, firewall inspection and filesystem permissions. Component modules handle Panel and Wings separately. A coordinator orders them and delegates migrations to Migration Hub. Keep secrets out of process arguments, shell history, plans and logs. A redacted transaction journal records completed steps, file hashes, component versions and recovery checkpoints. Never store plaintext credentials in the report.

Pin artifacts by release and digest, validate their origin and signatures when available, reject unexpected archives/paths, stage in a private directory and validate before replacing application binaries. Do not fetch moving `latest` URLs during unattended operations. Validate installation state, disk/inodes, DNS/TLS, database connectivity, Redis, ports, runtime extensions, Docker/kernel support, host architecture and source/target version compatibility. Detection of an unrelated existing installation is a stop condition, not permission to overwrite it.

Each step declares prerequisites, desired state, outputs and recovery behavior. A rerun must recognize completed steps without regenerating keys, duplicating database records or reinstalling workloads. A migration or failed upgrade must not be blindly retried after partial mutation. Preserve original config and services until the rollback window closes.

## Six operations

| Operation | Plan and ordered work | Validation and recovery |
| --- | --- | --- |
| Install IbisPanel | Confirm empty/dedicated target; prepare PHP/web/DB/Redis; stage source/build; configure new environment/key; apply fresh schema; create admin; configure queue/scheduler/TLS | Login/API/queue/scheduler checks; remove only journal-owned fresh resources on failure, retaining diagnostic evidence |
| Install Wings only | Validate existing Panel compatibility; check Linux/Docker/kernel/ports; stage pinned daemon; securely provision node config; enable service | Authenticated node status, power/file/SFTP smoke tests on a disposable server; restore old config/binary if replacing an explicitly selected component |
| Install IbisPanel + Wings | Produce one plan with separate Panel and node stages; install Panel first, then establish node credentials and Wings | Validate both components and an isolated workload; report partial component state and resume from a safe checkpoint |
| Update | Inventory actual source version and customizations; verify full backups and restore test; quiesce writers; stage compatible code/assets; apply reviewed schema changes; restart workers | Health checks before reopening traffic; restore matching code, DB and secret/config snapshot together when rollback is required |
| Migrate from another panel | Delegate read-only discovery/dry-run to Migration Hub; show unsupported entities and downtime; require verified backup/recovery plan before later apply | Compare entity/file/database counts and hashes; controlled node ownership switch; restore source ownership and data from the checkpoint on failure |
| Diagnose / repair | Diagnose read-only by default: services, permissions, queues, disk, TLS, DB, tokens and version drift; propose narrowly scoped repairs | Apply only selected repairs; record changes and backups; never reset APP_KEY, permissions globally or database schema as a generic repair |

## Manual installation parity

Every supported operation needs a documented equivalent manual path with identical prerequisite and verification gates. Automated installation must not become a requirement to use IbisPanel. See `MANUAL-INSTALLATION.md`; this Phase 0 runbook is for future implementation and isolated development planning, not a production-tested release guide.

## Recovery and release gates

Require an encrypted backup set containing DB, application environment/encryption key, node configs, workload files/volumes, workload databases, and backup inventories. Verify restoration into a separate destination before modifying an existing installation. A database down-migration alone is not a recovery strategy. During rollback ensure only one control plane and one daemon own each workload; stop conflicting writers first.

Before implementation, choose supported distributions and runtime matrix from the locked baseline, specify artifact signing/distribution, create fault-injection and resume fixtures, and resolve system-service naming deliberately. Preserve inherited `pterodactyl` identifiers until a separate rebranding change is approved. Do not silently alter unrelated services or firewall rules.
