# Phase 1A: panel identity

Baseline: `d7549cf` imported Pterodactyl Panel `v2.0.0-beta.2`. This phase changes presentation identity only. PHP namespaces, Composer and npm package names, database keys, APIs, Wings communication and existing navigation remain upstream compatible.

## Changes

- `APP_NAME=IbisPanel` and `MAIL_FROM_NAME=IbisPanel` in the example environment; config fallbacks use the same name. Existing installations with an explicit `APP_NAME` or saved `app:name` setting must update that setting themselves.
- Original horizontal and icon PNGs copied from `website/public/brand` into `public/brand`. A transparent wordmark derivative is used for the dashboard and sign-in card. Sized derivatives of the supplied icon serve browser and application icons. The originals are unchanged.
- `resources/scripts/assets/ibispanel.css` overrides the classic theme's dark background, surfaces, primary, accent, border and focus-ring tokens. Layout dimensions, status colors and component recipes are unchanged. The existing light scheme retains its upstream palette and places the light wordmark on a navy plaque if a theme offers light mode.
- The browser title, manifest, favicon and mail sender reflect IbisPanel. The login copyright continues to acknowledge Pterodactyl Software.

## Validation and limits

The source and both lockfiles were inspected before editing. The original repository was clean. `git diff --check` and static file inspections validate this patch. PHP, Composer, npm, WSL, `vendor/` and `node_modules/` are unavailable in this Windows environment, so linting, TypeScript, production build, PHP checks and application/browser runtime checks could not be run here. No runtime compatibility claim is made.

To finish validation in a suitable development environment, install dependencies using the existing `composer.lock` and `package-lock.json`, then run `npm run lint`, `npm run tsc`, `npm test`, `npm run build`, and `composer check`. With a local database and configured `.env`, inspect sign-in, server list, console, files and admin pages at desktop and mobile widths. Review light mode if a theme enabling it is installed.
