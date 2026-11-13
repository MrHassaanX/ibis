# Phase E.7 status

Updated: 2026-11-06. Stages 1–3 committed; Stage 4 audited and partially showcased; Stage 5 validated with a CONDITIONAL GO decision.

## Baseline

- Windows and WSL panel HEAD: `5e3c1a256de75c5d74b9cc7aa0dad421e969aed0`; both clean at start.
- The local panel was already listening at `127.0.0.1:8000`. Existing dependencies and services were retained.
- Scope and order: account identity and sounds; console controls and telemetry cards; workload images; safe development showcase; final visual validation.

## Stage 1 — Account (complete)

- Commit: `33533155a3e23c6aa8468bc13862cf574171b084` (identical Windows/WSL object).
- Users can edit existing first and last name fields and their username. Username changes require the current password; validation and role/ownership invariants have integration coverage.
- Account overview now has a responsive identity/profile card, language and personal sounds beside existing password, email and two-factor cards. Existing UUID avatar is reused.
- Sound preferences are per-user, disabled by default, and use original Web Audio tones on confirmed connected transitions while viewing a server. Restart completion is optional and not implemented.
- Local `ibispanel_dev` applied only the additive `2026_11_05_000002_add_sound_preferences_to_users` migration.
- Validation: 24 PHP integration tests (142 assertions); 13 focused frontend tests; TypeScript, lint, OpenAPI/SDK generation and production build passed. OpenAPI contract suite reported 6 tests and 6147 assertions.
- Authenticated Edge screenshots: `references/phase-e7/account-1440.png` and `references/phase-e7/account-390.png` (outside Git). Real browser showed identity and sounds card, disabled default, a working 35→48 volume slider, no horizontal mobile overflow and zero runtime exceptions. Audible output on the user's hardware has not been verified.

## Stage 2 — Console and resource cards (validated)

- Commit: `8922a5594d7186db240c770842a404ffd5593b81` (identical Windows/WSL object).
- Preserved Ghostty/Wings streaming. The toolbar filters a bounded, viewer-local console buffer by real log level, searches, copies, clears only local output and enters fullscreen. Command input is a separate footer and dispatches only for an authorized, running server with a connected Wings socket.
- The console badge combines process and socket state. An offline server remains Offline even with a connected socket; transitional states are amber, disconnected running is red, and unknown is neutral. Console history remains visible when the socket disconnects.
- CPU, memory, disk and network cards have compact, distinct-color sparklines sourced from the existing bounded Wings telemetry history. No samples are fabricated. Detailed graphs remain available in a collapsed panel.
- Validation: 27 focused frontend tests across six files, TypeScript, zero-warning lint, and production build passed. Tests cover filtering/counts/ANSI, clear/copy/search, command dispatch/permissions, disk history and process/socket status transitions.
- Authenticated Edge screenshots outside Git: `references/phase-e7/fabric-console-{1440,1024,768,390}.png`. The existing Fabric server was verified stopped: badge Offline/neutral, command disabled, four resource cards, no horizontal overflow at all four widths and zero browser exceptions. No server was started. Its offline state has no live telemetry samples, so visual verification of populated sparklines remains pending a naturally running server.

## Stage 3 — Workload icons and banners (validated)

- Commit: `cb8192d2e56087adf836b08620891acbade6ba59` (identical Windows/WSL object).
- Server and Egg icon uploads use the existing appearance storage and administrator image API. Image order is server override, Egg override, category SVG and generic SVG. Banner order is server override, Egg override, category WebP and global/generic fallback. Existing custom images remain intact.
- A single Egg-tag/capability resolver covers Minecraft Java/Bedrock, Discord.js, Node.js, static websites, web applications, FiveM, Hytale, Python and generic servers. Ten small original SVG icons live in `public/brand/workloads`; original supplied WebP banners remain in use. No server names are used for classification.
- The header and dashboard card display the workload icon. Legacy, OLED, Light and System now use mode-appropriate contrast gradients; OLED no longer hides the banner. Images use cover/contain as appropriate, with icon fallback if an uploaded file disappears.
- Validation: 8 focused PHP appearance integration tests (92 assertions), one frontend icon-fallback test, TypeScript, zero-warning lint, OpenAPI/SDK generation, OpenAPI contract (6 tests, 6147 assertions) and production build passed. `GetServerTest` has an independent existing capability assertion expecting `minecraft.plugins` without a content profile; it was rerun alone and still fails. Stage 3 did not modify capability logic.
- Authenticated Edge checked existing Paper and Fabric: both resolve to `/brand/workloads/minecraft.svg` and the shipped Minecraft banner. Paper header screenshots in Legacy, OLED, Light, System dark/light at 1440px plus Legacy at 1024/768/390px; dashboard screenshots in Legacy/OLED/Light at 1440px. Images loaded, banners remained visible, no horizontal overflow, zero browser exceptions. Screenshots are in `references/phase-e7/` outside Git. Administrator's original System preference was restored.
- No server, Egg, EULA, or queued job was modified during this stage.

## Stage 4 — Safe local showcase (partial)

- Stage 3 commit: `cb8192d2e56087adf836b08620891acbade6ba59`, identical and clean in both checkouts before Stage 4. Stage 4 changed local data only; no source commit was made for server records.
- Audited and backed up Paper 476 and Fabric 477, then deleted only those records through the Panel lifecycle. Their private archives and metadata are at `/home/omenh/.config/ibispanel/e7-stage4-backups/` with `0700` directory and `0600` files; archive integrity passed.
- Provisioned one stopped Node.js showcase, ID 995, using existing Egg 15, existing local Docker image and allocation 64738. The Egg received a `nodejs` tag for metadata-based artwork classification. No application was started. The other requested categories remain isolated artwork fixtures because compatible Eggs are absent or would require downloads; `skip_scripts` would misleadingly mark empty Minecraft servers installed.
- Actual authenticated dashboard screenshots in `references/phase-e7/showcase-dashboard-*` cover Legacy, OLED, Light, and 1440/1024/768/390px; an explicitly labeled 10-category fixture is `references/phase-e7/workload-artwork-fixture-1440.png`. See `references/phase-e7/STAGE4-REPORT.md` for the audit and preservation details.

## Stage 5 — Final validation

- Stage 5 focused validation: 147 PHP tests (900 assertions), 43 frontend tests, TypeScript, formatting, lint and production build pass. The Stage 3 OpenAPI/SDK checks remain valid because Stage 5 changed no API contract.
- Authenticated Edge checked Legacy/OLED/Light dashboard metric contrast, Account, Appearance and the stopped Node.js console at desktop/mobile widths with zero runtime exceptions. The console badge is Offline and commands are disabled.
- Final evidence, retained data and limitations are in `PHASE-E7-FINAL-REPORT.md`. Stage 5 fixes the card metric contrast and an outdated capability test expectation. Live sound output, new running telemetry and additional real workload records remain unverified or partial; the stopped showcase was not started to fabricate them.
