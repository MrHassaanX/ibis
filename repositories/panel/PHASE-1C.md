# Phase 1C branding audit

IbisPanel remains the existing Pterodactyl 2.0 panel. The navigation now shows the official ibis icon next to the configured panel name. Login keeps its stacked IbisPanel identity. The common client and admin footer and the authentication footer read `© 2026 Ibis Panel Software`.

The existing Admin → Settings → General → Company Name field writes `settings::app:name` through the authorized Admin API. `SettingsServiceProvider` loads it into `config('app.name')` on subsequent requests, and the frontend query cache updates the header immediately after save. Browser page titles include the configured name. The default is `IbisPanel`; `.env.example` now permits database-backed settings. Operators choosing environment-only settings can still enable `APP_ENVIRONMENT_ONLY=true`, which intentionally makes the form read-only. Names are trimmed, required, and limited to 191 characters. React renders the name as text, and Blade escapes it in the document title.

## Remaining upstream references

- **Compatibility identifiers retained:** PHP `Pterodactyl` namespaces, Composer/npm and SDK package identities, database and migration keys, `pterodactyl:*` settings, session and theme identifiers, Wings protocol and generated API types. Renaming these would change contracts.
- **Attribution retained:** `LICENSE.md`, upstream authors and history, third-party licenses, and the original authors and emails in bundled Eggs. Egg author entries describe their actual maintainers, not this fork.
- **External dependencies retained:** Pterodactyl release/update links and documentation in the admin overview, the official egg catalog, yolk container images and upstream API references still point to their real sources. These should be reviewed only when IbisPanel operates equivalent maintained services; no replacement endpoint is assumed here.
- **Other repositories deferred:** Wings, Eggs, Installer, Migrator and Docs branding belongs in their own phases. Their source was not changed in this panel phase.

No global source replacement was performed. Existing admin navigation, dashboard, server and form layouts remain unchanged.
