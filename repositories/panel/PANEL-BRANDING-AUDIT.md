# IbisPanel panel branding audit

Updated 2026-11-06. Scope: Panel repository only. Phase M remains paused.

## Replaced IbisPanel-owned presentation

- PWA manifest name and short name, legacy translation copyright, test email, CLI migration/upgrade/telemetry wording, console viewer prelude, UI fixture brand, exported Egg generator comment, API documentation examples, root npm package name, and the repository landing page.
- Administrator overview links are labeled as upstream resources. Its release card no longer presents an upstream release as an automatic IbisPanel update.
- The unused upstream mark component was removed; the login card already uses the official IbisPanel mark.

## Retained upstream references

- MIT license notices, original authorship, source history, and explicit upstream attribution in README remain.
- Egg catalog URLs and their Pterodactyl origin remain visible where that external catalog is being used. Upstream release, documentation, community, donation, telemetry and signed extension endpoints are external integrations; they must not be relabeled as IbisPanel services.
- `ghcr.io/pterodactyl/yolks`, `/etc/pterodactyl`, `/var/lib/pterodactyl/volumes`, Wings configuration, and egg import paths are existing runtime contracts. They are retained to avoid disrupting nodes and servers.
- `Pterodactyl\\` PHP autoload namespace, root Composer package name and lock metadata, `config('pterodactyl.*')`, `pterodactyl:*` persisted settings and cache keys, `PTERODACTYL_*` environment flags, `PterodactylUser` bootstrap, `pterodactyl_scheme` cookie, `@pterodactyl/sdk`, and `p:*` Artisan commands are compatibility identifiers. Renaming them requires a separate migration and compatibility tests. Their presence does not make them UI product branding.
- Third-party notices and dependency identifiers are not rewritten.

The hosting provider's configurable company name and mail sender remain configurable. No database, node, Wings, Yolks, Egg, Docker image, or user server data was renamed by this audit.

## Verification

- 52 focused PHP tests passed (258 assertions); Composer configuration validated without changing the lock file.
- 23 focused frontend tests passed. TypeScript, lint and production build passed.
- Authenticated local Edge checks loaded login, dashboard, admin Appearance, account, stopped server console, Files, Backups and Startup. The removed `/software` route did not render. No browser exceptions were reported. Screenshots are in the private `references/phase-m` and `references/phase-e7` directories outside Git.
