# Contributing to IbisPanel

Contribute under MIT while retaining every applicable upstream or third-party notice. Imported Pterodactyl code remains attributed to its original authors. Identify IbisPanel changes in focused commits and explain the behavior, reason, validation and risks. Do not mass-edit copyright headers, namespaces, dependencies or formatting.

Open a scoped issue or proposal for features. Prefer the inherited extension/theme interfaces; explain any core API, schema or Wings protocol change before implementing it. Schema changes must use forward migrations and document recovery and version compatibility. Do not edit already-applied upstream migrations to change installations retroactively.

Use separate branches in the relevant repository. Include commands actually run and their results; explicitly list skipped checks and missing services. For Panel use the locked upstream Composer/npm workflow and tests. For Wings use Go's checks on Linux. For Eggs retain author/license metadata, validate import with the real Panel and test scripts only in disposable containers. Do not commit credentials, production data, environment files, dependency directories or build artifacts.

Review security-sensitive code, add-on lifecycle hooks, Docker access and path handling carefully. Use dependency locks and small changes so upstream security fixes remain reviewable. Keep repositories independent; do not reset them to upstream, rewrite initial history, force-push, or remove notices.

Phase 0 ends at local commits. Pushing, publishing releases, deploying and implementing the Phase 1 roadmap are separate work.
