# Phase E.7 final validation — 2026-11-06

**Decision: CONDITIONAL GO.** The implemented account, console, telemetry presentation, and workload artwork pass focused tests and authenticated visual checks. The local showcase is deliberately partial: only Node.js has a real server record. Audible server transition sounds and populated telemetry on a currently running server remain unverified. Phase E.7 can close as a validated implementation with these explicit runtime limits; it is not evidence of nine live workload integrations.

## Source checkpoints

| Stage | Local panel commit | Result |
| --- | --- | --- |
| 1 — Account and sounds | `33533155a3e23c6aa8468bc13862cf574171b084` | Complete |
| 2 — Console and resource cards | `8922a5594d7186db240c770842a404ffd5593b81` | Complete |
| 3 — Workload icons and banners | `cb8192d2e56087adf836b08620891acbade6ba59` | Complete |
| 4 — Safe showcase | No source commit; local data only | Partial |
| 5 — Validation and narrow fixes | This report's commit | Conditional acceptance |

The Stage 5 source changes improve metric text contrast on artwork cards and correct an outdated test expectation. Plugin/mod navigation requires a detected Minecraft software profile; Egg features alone do not grant it. No capability or authorization code was weakened.

## Implemented and checked

- Account profile supports first name, last name, and username updates; username changes require the current password. Personal language, appearance, and opt-in sound preferences remain available. Existing email, password, and two-factor controls remain visible. Integration tests cover validation, uniqueness, persistence, and role invariants; the authenticated Account page and sound controls rendered at desktop/mobile widths. The sound slider interaction was checked in the browser. Audible output on the owner's device and live start/stop sound transitions were not checked.
- Console filters real Wings log lines by all/warnings/errors, searches, copies, clears its viewer-local buffer, and supports fullscreen. Its command footer requires permission, a running process, and a connected socket. State tests cover transitions; an authenticated stopped server showed a neutral **Offline** badge with command entry disabled. No server log file was deleted to test Clear.
- CPU, memory, disk, and network cards use bounded real telemetry history; offline cards show no invented samples. Earlier Stage 3 captures of the then-running Paper server show real readings. The current Node.js showcase is stopped, so this final pass could only check offline cards and contrast, not newly populated live graphs.
- Workload category icons and banners resolve from Egg tags/features, with administrator server/Egg overrides and safe defaults. Browser captures confirmed Minecraft artwork on the original Paper/Fabric records before their authorized Stage 4 disposal, and Node.js artwork on the new showcase. Legacy, OLED, Light, and System appearance captures checked banner visibility and legibility. All 20 assets in the labeled ten-category fixture loaded. Other workload fixtures are visual examples, not server records.
- The dashboard, Account, Admin Appearance editor, server header and console were inspected in authenticated Edge. Stage 2 and Stage 4 captures cover 1440, 1024, 768 and 390 pixel widths; this final pass repeated the changed dashboard colors and checked Account, Appearance, and console at desktop/mobile widths. No horizontal page overflow or JavaScript exceptions were observed in these captures.

## Validation results

| Check | Result |
| --- | --- |
| Stage 5 focused account, appearance, server API and capability PHP tests | 44 passed, 264 assertions |
| Stage 5 Minecraft properties/content, region, themes, server creation and Modrinth tests | 103 passed, 636 assertions |
| Stage 5 account, sounds, dashboard, icons, console and chart frontend tests | 43 passed across 8 files |
| TypeScript and formatting | Passed |
| Type-aware lint | 0 warnings, 0 errors |
| Production build and extension runtime check | Passed |
| OpenAPI/SDK generation and contract check | Passed in Stage 3; no API contract changed in Stage 5 (6 contract tests, 6147 assertions) |
| Authenticated browser | Node.js dashboard Legacy/OLED/Light, Account, Appearance, offline console; zero exceptions |

Existing integration suites also cover Minecraft authorization/content status, locations, theme management, and server creation. These checks do not substitute for live server file, backup, network, plugin/mod installation, or notification delivery trials. No old queue job was processed.

## Local showcase and data preservation

- Original disposable Paper **476** and Fabric **477** were audited. Paper was gracefully stopped; both full Wings volumes and metadata were archived and verified before Panel lifecycle deletion. Private backups remain in `/home/omenh/.config/ibispanel/e7-stage4-backups/` (directory `0700`, files `0600`). See the private `references/phase-e7/STAGE4-REPORT.md` for details.
- The only new server is **Ibis Demo - Node.js**, ID **995**, UUID `cf8e26a8-88b1-4ede-a564-3a2f4f0c7a40`, owner `ibisadmin`, private WSL allocation `172.20.175.81:64738`. It is stopped, has no uploaded application, and was never started for this validation. One private allocation remains free. Other requested workload types lack a locally compatible Egg or installer and were not represented as fake server records.
- No EULA was changed, no pending content job was executed, no public listener was created, and no secrets were committed. Local login credentials and server backups remain private.

## Screenshot evidence

Screenshots and the private browser scripts are outside Git in `references/phase-e7/`:

- Final dashboard: `final-dashboard-{legacy,oled,light}-1440.png`; metric labels/values computed as `rgb(240, 248, 255)` in all three modes.
- Final Account/sounds: `final-account-{1440,390}.png`.
- Final Admin Appearance: `final-appearance-{1440,390}.png`.
- Final stopped Node.js console: `final-console-{1440,390}.png`.
- Prior Minecraft headers, four-width Fabric console, four-width Node.js dashboard, and the ten-category artwork fixture are named `paper-header-*`, `fabric-console-*`, `showcase-dashboard-*`, and `workload-artwork-fixture-1440.png` in the same private directory.

## Remaining limits and source control

Live audible transition behavior, hardware autoplay behavior, freshly populated running-server sparklines, and live plugin/mod installation were intentionally left unverified. The Stage 4 multi-workload showcase is partial because the missing Eggs or software downloads were outside the safe local scope. No critical regression was found in the tested paths. Windows and WSL are synchronized to the same local Stage 5 commit; final Git status and exact SHA are reported with the handoff.
