# Development setup

## Observed Windows environment

Git 2.56.0.windows.4, Node 24.22.1 and pnpm 11.25.0 are available. PHP, Composer, Go, Docker, npm and yarn are absent from PATH. The Python entry is a Windows Store alias, not a validated Python runtime. No dependencies or services were installed. pnpm availability is not a reason to replace the upstream npm lockfile.

Use a Linux VM or WSL2 with a Linux filesystem for runtime work. Windows here is a source/documentation workspace; it is not a validated Wings host. Do not deploy from this Phase 0 checkout.

## Panel requirements and inherited workflow

Read the locked `composer.json`, `composer.lock`, `package.json`, `package-lock.json`, `.nvmrc`, and `.github/workflows/ci.yaml`. The source declares PHP `^8.3`, Laravel `^13.0`, Composer platform PHP 8.3.0, and Node >=22.12. `.nvmrc` selects Node 22. A package may impose a stricter transitive requirement; only Composer platform checks can confirm the installed runtime. Do not bypass platform requirements or regenerate lockfiles to make setup appear successful.

The upstream CI tests PHP 8.3/8.4 with MariaDB 10.11/11 and MySQL 8/9, and uses Node 22. Provide the union of extensions required by Composer and CI: intl, json, mbstring, PDO, pdo_mysql, posix, zip, bcmath, curl, gd, openssl, tokenizer, and XML support. Use Composer 2, Redis, a web server serving only `public`, queue workers and scheduler. See [official requirements](https://docs.pterodactyl.io/v2/panel/requirements).

The static check found an inherited root engine metadata mismatch: `package.json` declares Node `>=22.12`, while `package-lock.json` records `>=22`. Direct dependency specifications match. Keep both original files in Phase 0 and use the stricter manifest requirement. The checker reports this mismatch as a failed metadata check; it does not imply that `npm ci` was attempted or failed.

In an isolated development checkout with those prerequisites:

```sh
cd panel
composer validate --strict
composer install --no-interaction --prefer-dist
composer check-platform-reqs
npm ci
cp .env.example .env
php artisan key:generate
```

Configure a disposable database, Redis, mail sink and localhost URL before running `php artisan migrate --seed` and `php artisan p:user:make`. Key generation is for this new disposable environment only. Never regenerate a migrated installation's key. Avoid publishing or logging environment contents. Audit Composer lifecycle scripts and extension hooks before enabling untrusted add-ons.

Use the inherited commands, after inspecting their scripts:

```sh
npm run lint
npm run tsc
npm test
npm run build:vite
composer test
```

`composer test` includes unit/integration tests, type coverage, lint and static analysis, and requires configured services. `composer dev` starts the queue listener and Vite. The upstream `composer setup` also installs dependencies and builds assets; this is not a preflight-only command. None of these dependency-backed commands ran in Phase 0. Do not treat successful Node syntax checks as application test coverage.

## Wings

The selected `go.mod` requires Go 1.24.0 and selects toolchain go1.24.1. Use the module's versions unchanged. In an isolated Linux checkout with Docker available:

```sh
go mod download
go mod verify
go test ./...
go vet ./...
go build -o build/wings ./wings.go
```

Package tests may need filesystem/ownership permissions and external resources. Record failures individually. Do not run the debug Makefile target against a production node; it uses privileged/debug options. Set up a disposable node for protocol verification. No daemon binary was built or started here.

## Source-only checks

From the parent workspace run `node docs/tools/verify-source.mjs` and `node docs/tools/inspect-foundation.mjs`. These need no package installation. The first deliberately reports an inherited malformed Sunkenland sample JSON asset as a failure; all source blob comparisons can still pass. See the validation report for the distinction. Re-run with `--write-report` only when intentionally refreshing committed evidence.
