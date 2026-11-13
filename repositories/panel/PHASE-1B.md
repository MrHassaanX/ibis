# Local WSL development

The runtime checkout is `/home/omenh/ibispanel-dev/panel` in Ubuntu-24.04 WSL. The Windows source of record is `D:\Stax\STAX DEVS\STAX CODEX\ChatGPT\IbisPanel\panel`. The localhost application is available at `http://127.0.0.1:8000` while `php artisan serve` is running.

Open Ubuntu with `wsl.exe -d Ubuntu-24.04`, then `cd /home/omenh/ibispanel-dev/panel`. In noninteractive shells, run `. ~/.nvm/nvm.sh` before npm commands. Start MariaDB and Redis if WSL has restarted (`sudo service mariadb start` and `sudo service redis-server start`; a root shell is needed if sudo prompts). Check them with `mariadb` as root and `redis-cli ping`.

The ignored `.env` is for local development only. It uses the dedicated `ibispanel_dev` database, local Redis and `RECAPTCHA_ENABLED=false` for localhost sign-in. The separate `testing` database is used only by PHPUnit. Never point `.env` or `phpunit.xml` at another database before migrations or tests. The local administrator is `ibisadmin` (`admin@ibispanel.local`); its generated password is readable only by the Ubuntu user at `/home/omenh/.config/ibispanel/dev-admin`. Do not copy it into this repository or a report.

Run `php artisan serve --host=127.0.0.1 --port=8000` from the runtime checkout. Stop it with Ctrl+C. Restart it with the same command after source or configuration changes. For background jobs in a separate terminal, use `php artisan queue:work --queue=high,standard,low --sleep=3 --tries=3`; stop with Ctrl+C. During development, invoke `php artisan schedule:run` when a scheduled task needs testing. No permanent queue or scheduler service is configured.

Laravel logs are in `storage/logs`; `MAIL_MAILER=log` writes development email there. Storage and cache paths belong to the Ubuntu user. `php artisan optimize:clear` clears configuration, route and view caches after `.env` edits.

To validate, run `. ~/.nvm/nvm.sh`, `npm run lint`, `npm run tsc`, `npm test`, `npm run build`, and `composer test`. `php artisan migrate:status` checks the development database. The PHP integration suite also needs `php8.3-sqlite3` for its in-memory tests. Dependencies were installed from `package-lock.json` with `npm ci` and `composer.lock` with `composer install`; do not update them to troubleshoot a runtime issue.

For source changes, first ensure both Git trees are clean. Commit changes in the Ubuntu checkout, then fetch that checkout from the Windows repository with a path-based Git remote and fast-forward only; never overwrite uncommitted Windows work. Alternatively, make a clean commit in Windows and fast-forward the Ubuntu checkout from it. Keep `.env`, credentials, `vendor`, `node_modules`, built assets and databases local.

If the login page reports captcha failure, check that the ignored local `.env` contains `RECAPTCHA_ENABLED=false` and run `php artisan optimize:clear`. If the page cannot connect to the database or Redis, check those local services before changing source code. Server console and file operations require a configured Wings node and cannot be exercised in this panel-only runtime.
