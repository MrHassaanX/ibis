# Roadmap after Phase 0

Phase 0 stops after source import, documentation, validation evidence and local commits. The following order is recommended, not implemented:

1. Establish the Linux development/CI matrix using the exact pins; resolve dependency/platform issues and the sample asset error in separate commits; run baseline tests and Panel/Wings/Egg smoke tests. Review workflow permissions and publishing targets before any push.
2. Define IbisPanel release policy and independent distribution identity. Review upstream URLs, telemetry, marketplace behavior, security reporting, trademark use and release artifacts before deliberate rebranding. Keep protocol compatibility explicit.
3. Specify and test a supported extension/theme contract using the inherited SDK. Add fixtures and permission/lifecycle tests before introducing new features.
4. Design workload capabilities for websites, apps and bots, including reverse proxy integration, TLS, ports, secrets, data ownership and backups. Create reviewed Eggs only after capability and licensing decisions.
5. Implement the installer preflight, plan and manual-runbook parity before install/update actions; add recovery tests and pin artifacts.
6. Implement Migration Hub read-only discovery/dry-run for narrowly specified Pterodactyl versions, then isolated staging and recovery. Add Reviactyl, Pelican and PufferPanel profiles only after fixture-driven mapping research. Unsupported data must be reported explicitly.
7. Consider independent Wings enhancements only after daemon protocol regression coverage exists. No daemon changes are part of this foundation.

A production release requires passing runtime validation, tested backups/recovery, audited release automation, current security review and explicit support/version documentation. Phase 0 does not establish those gates as passed.
