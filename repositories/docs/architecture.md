# Architecture baseline

## Boundaries

Panel is the control plane. Its Laravel backend owns identities, authorization, node and server metadata, allocations, database provisioning metadata, backup metadata, and workload definitions. React provides the client experience. API routes, actions, policies, services, and models remain as imported. Queue workers and the scheduler execute background work. MySQL/MariaDB persists panel state; Redis supplies queues and caching as configured.

Wings is the execution plane on each Linux node. Panel sends authenticated daemon requests; clients use the existing console and file interfaces. Wings manages Docker containers, server files, SFTP, backups, resource limits, and power actions. Docker access is a privileged trust boundary. Preserve current tokens, scopes, WebSocket authorization, path restrictions, and transport requirements.

Eggs describe images, startup commands, environment variables, config parsing, and installation scripts. Importing a definition is different from executing it. Container images and external script downloads have their own licenses, security posture, and availability. Neither byte integrity nor JSON validity establishes safe execution.

Installer and Migrator are design-only repositories in Phase 0. They must call documented control-plane interfaces or deliberately versioned offline tools in future phases; they must not silently bypass authorization or edit a live database under active writers.

## Existing code map

| Path in Panel | Preserved responsibility |
| --- | --- |
| `app/Actions`, `app/Services`, `app/Models`, `app/Policies` | Application behavior, orchestration, data and access control |
| `routes`, `app/Http` | Existing HTTP API and middleware contracts |
| `database/schema`, `database/migrations`, `database/legacy-migrations` | Schema history and upgrade behavior |
| `app/Services/Daemon` | Panel-to-Wings communication |
| `app/Services/Extensions`, `app/Providers/ExtensionServiceProvider.php` | Inherited extension loading and runtime integration |
| `app/Services/Themes` | Existing theme discovery and resolution |
| `packages/sdk`, `packages/hello-world` | Upstream extension SDK and example |
| `resources/scripts`, `vite.config.mts` | React client and frontend build |
| `tests`, `.github/workflows/ci.yaml` | Upstream verification conventions |

Do not confuse `app/Extensions` (also containing framework integration helpers) with the entire community extension system. Use the actual extension services and SDK contracts.

## Future modularity

Prefer the inherited extension manifests, providers, permission registration, client SDK, and theme services for new features. Keep community add-ons versioned against explicit Panel/SDK contracts. Extensions execute trusted code; they are not a security sandbox. Require license declarations, supported versions, narrowly scoped permissions, reviewed lifecycle hooks, and reversible configuration changes. Preserve the existing feature gates and failure handling.

Websites and bots can eventually share workload lifecycle primitives with game servers. HTTP routing, certificates, domain ownership, secret delivery, database lifecycle, and backups require separate designs before promising a universal hosting experience. Do not force those concerns into Wings during Phase 0.

## Security update strategy

Keep an immutable upstream pin per import and small separate IbisPanel commits. Review upstream advisories and release diffs regularly. Apply fixes on a branch, retain notices, run the relevant Panel/Wings contract and regression suites, and update the pin only after review. Never bulk replace the independent branch with upstream history. Snapshot imports retain upstream objects locally but intentionally do not merge unrelated ancestries. See provenance for replication and review details.
