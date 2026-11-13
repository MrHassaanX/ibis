# Security reporting and development

Do not publish live credentials, customer exports, exploit-ready reproduction data or private backups in public issues. Use GitHub private vulnerability reporting on the relevant IbisPanel repository if enabled. If it is unavailable, ask maintainers to provide a private reporting channel without posting sensitive details. This foundation does not invent a security email address or claim an operational response SLA.

For inherited upstream vulnerabilities, coordinate with upstream's documented security policy and retain advisory references in any fix. Track the old/new source pin, affected versions, mitigation and validation. No runtime security audit was performed in Phase 0.

Use synthetic or anonymized fixtures, disposable nodes, least-privilege service identities and isolated databases. Backups and migration reports can expose keys and personal data; encrypt them, limit retention and access, and redact reports. Extensions and Egg installation scripts execute code and require a trust decision before use. Keep Docker sockets away from public/untrusted clients.
