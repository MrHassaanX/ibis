# Phase E.5 status

Updated: 2026-11-05. Resume here without repeating E.4 research or altering old jobs.

## Baseline

- Windows and WSL began clean at `28fbca869210adcd270d72393583ddfd30f3fcec`.
- The E.5 reference package and all seven screenshots are outside Git at `references/phase-e5`.
- The Windows startup wrapper was blocked by PowerShell execution policy; the existing `scripts/dev-up.sh` brought the local panel online. No game server was started or stopped.

## Stage 1 diagnosis

- `QUEUE_CONNECTION=redis`, default queue `standard`; no Laravel queue worker was running. Redis had seven pending `standard` jobs (two server notifications and five old Minecraft content jobs), zero reserved or delayed jobs. Two older notification failures exist in `failed_jobs`.
- Only managed content row 4 remains: Paper server database ID 476, project `P1OZGk5p`, release `h2Bniign`, state `queued` since 2026-11-04 13:27:11, with no hash or error. Jobs for missing rows 1–3 are also pending. This explains the `INSTALLING...` card: the UI treated any `queued` row as indefinitely in progress.
- No old job or notification was processed, removed or retried during diagnosis.

## Stage 1 validated

- New content jobs use only `redis_minecraft_content` / `minecraft-content`; retry window 240 seconds exceeds the 180-second worker timeout. `scripts/dev-content-worker.sh` is an opt-in foreground worker with a single-process lock. `docs/minecraft-content-worker.md` documents supervision and recovery. Existing `dev-up` scripts do not start a worker.
- Additive migration added nullable `operation_id` and `requested_version_id`. Old serialized jobs have no operation ID and cannot perform an install. New jobs check the operation ID and requested release before touching Wings. Duplicate requests return the same in-progress operation; a stale operation requires reviewed user retry. Worker failures record a sanitized terminal state.
- Managed content now exposes `worker_unavailable` for fresh queued work without a dedicated worker and `stalled` after five minutes without progress, with a UTC-qualified last update and a review-retry action. The actual persisted phases are queued, downloading, verifying, installing, installed or failed. No previous row or queue payload was edited to obtain the UI state.
- A new pinned Fabric API 0.141.6+1.21.11 mod was queued for the **offline disposable Fabric test server 477** only after confirming no existing target file, record or dedicated queue backlog. One `queue:work ... --once` invocation completed it. Wings holds the 2,426,039-byte jar, whose SHA-512 matches the managed row (ID 5, installed). Fabric remained offline. Existing Paper row 4 remains queued and all seven prior `standard` jobs remain pending.
- Stage 1 checks: 11 PHP integration and artifact tests passed / 45 assertions; TypeScript, full lint and production build passed. Authenticated 1440 px screenshots show the Paper stalled notice/retry and the installed Fabric mod; 390 px capture shows the installed mod without clipping. Captures are private at `references/phase-e5/paper-stalled-install-1440.png`, `fabric-installed-mod-1440.png` and `fabric-installed-mod-390.png`.
- Stage 1 commit: `13bf0877e3a6f74ac576cb9a2fb050f67abd6a1e`. The old Paper request cannot be fulfilled while Paper is running; its user may review retry after stopping it. The standard backlog remains intentionally unprocessed.

## Stage 2 validated

- The left navigation now starts expanded even for an older browser profile that stored a prior collapse choice. It still supports a user-controlled compact rail and the existing top-navigation alternative. The authenticated server view shows General, Management and Minecraft sections from the existing capability registry.
- The standalone `Servers / server-name` breadcrumb text is gone. The normal 56 px header now carries the compact server title, while the existing identity card retains real name, allocation, region, status, uptime and power controls. Dark System and Ibis Legacy use navy/cyan; Dark OLED keeps its separate near-black palette; Light remains supported.
- Console metrics received compact panels and a two-column mobile arrangement. CPU, memory, disk and network values still come from Wings. The network card explicitly labels its values as traffic totals. The real terminal and three real telemetry graphs remain in place; no sample series or server statistics were invented. Light mode now uses a dark terminal canvas with legible text and ANSI colors.
- The Appearance editor's draft image previews use file data URLs. An authenticated browser test injected a real 1920 px WebP into the draft: preview loaded, and Reset removed it. The draft was not saved. The existing accessible upload control, four preview modes, expanded preview, navigation setting and roundness control remain operational.
- Focused frontend layout suite: 20 passed. TypeScript, lint and production build passed. Authenticated captures at 1440 expanded/collapsed, 1024 expanded, 768 and 390 px are at `references/phase-e5/console-*.png`. Additional captures cover OLED, Legacy and Light console styling and the Appearance editor/draft upload. System preview was exercised with dark and light OS emulation; the existing top navigation was covered by layout tests, but a live top-navigation screenshot was not taken.
- Comparing the actual capture against `screenshots/03-target-ibis-neon-concept.png`: the left categorization, navy/cyan contrast, compact identity/metrics and dominant terminal are substantially closer. The real chart panels remain simpler than the concept and show only sampled telemetry. The current account preference is Dark OLED, so its normal capture is near-black rather than Legacy navy.
- Stage 2 commit: `4fc9d44dc33c8165a463b5ce88263aea7218792d`; Windows and WSL share the same commit object and clean working trees.

## Remaining

- Stages 3–5: Content Center, software/workload switching, players, startup presets and icon are not implemented. The existing plugin/mod manager and Stage 1 worker recovery remain available. Do not infer universal cross-software compatibility from the visual work.

## Guardrails

- Preserve server records, volumes, EULAs, legacy queue payloads, legal notices, four appearance modes and prior commits. Do not push, deploy or install proprietary addons.
