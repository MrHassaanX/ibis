# Phase E.4 status

Updated: 2026-11-05. This file tracks implementation and validation so an interrupted session can resume without repeating the reference review.

## Starting point

- Windows and WSL HEAD: `f0b3d10af542a44a046e2938315d7d26e3856bad`.
- Five Windows-only Phase E.3 follow-on edits were preserved in `references/phase-e4/e3-follow-on-checkpoint.patch` outside Git, then copied to the initially clean WSL checkout. A sixth edit updates the typed panel route union for the two new cross-links.
- The supplied E.4 docs and contact sheets were reviewed. The reference package is at `references/phase-e4` outside the panel repository.
- The existing startup script reported the panel ready; the Windows-side HTTP probe is restricted by local socket permissions. No game server was started or stopped.

## Work in progress

- Preserved E.3 follow-on edits validated and committed as `99791d560863eb2536c25c337e101908b4f5125e`; Windows and WSL were synchronized to the exact commit object.
- Stage 1: grouped capability-aware sidebar, compact server header, four real stat tiles, larger console, and responsive chart column implemented. The existing route metadata, power view, terminal transport, and Wings stats store remain in use.
- Stage 1 checks: TypeScript and focused lint passed; 36 navigation/console/layout tests passed; Vite build and extension runtime check passed. Authenticated Paper console screenshots captured at 1440 expanded/collapsed, 1024, and 390 px under `references/phase-e4/visual/` (outside Git). The screenshot showed genuine Paper logs and Wings resource figures. The mobile terminal clipping found on first capture was corrected and recaptured.
- Stage 1 commit: `257299b45773ef89ae3c98a7da84ef09f379fbb9`, synchronized exactly to Windows and WSL.
- Stage 2: network graph now calculates bytes/second from real Wings cumulative counters and monotonic elapsed time; first reports, counter resets, and invalid intervals have no fabricated rate. Memory history uses bytes and the same admin-selected display formatter as the stat tiles. Offline/collecting graphs show explicit empty states. The top bar has a compact server breadcrumb, and General includes Dashboard.
- Stage 2 checks: 37 focused graph/console/layout tests, TypeScript, lint, build, and authenticated 1440/1024/390 screenshots passed. The screenshots show real Paper CPU and memory history, and near-zero network throughput while idle. A short network tick label was then applied and its focused lint/tests passed; final integrated build remains for Stage 3.
- Stage 3: Admin Appearance now uses a wider two-column editor and preview, with an accessible styled native image picker. Choosing an image shows its filename and unsaved preview; Reset clears that draft. Existing server, Egg, global and brand upload paths remain in use. The supplied original workload illustrations are bundled as optimized WebP files under `public/brand/banners/` (eight assets, about 530 KB total). The existing banner service keeps server > Egg > global priority and selects a built-in fallback from trusted Egg tags, with neutral art for unknown workloads. Server cards render the image in compact, premium and banner layouts with a gradient and a missing-image fallback.
- Stage 3 checks: six focused PHP integration tests passed (55 assertions), including permissions, upload validation, banner precedence and all seven known workload tag mappings plus neutral fallback. Frontend TypeScript, full lint, SDK check, production build and 40 focused console/navigation/layout/chart tests passed. Authenticated browser captures at 1440, 768 and 390 px show real Paper and Fabric cards using the Minecraft art. The live Appearance screen was inspected at desktop and mobile widths; OLED, Light, Legacy, and System previews rendered, including System under a light OS preference. A local unsaved file selection showed its filename and preview, then Reset removed the draft. Browser captures are private under `references/phase-e4/visual/`. No appearance setting, server workload, EULA or queued job was changed during these checks.
- Stage 3 is the commit containing this status update; its SHA is reported in the final Phase E.4 handoff.

## Acceptance limits

- Only Minecraft servers are present locally, so the other bundled banner categories were validated by integration tests and artwork review, not as real running server cards.
- The Appearance preview uses clearly labeled sample content. We verified draft and reset behavior visually; a live save of each mode, upload and navigation combination was not exercised to avoid altering the administrator's active settings.
- Frontend layout tests emit a TanStack Query test-harness warning about the mocked site-settings query; all 40 tests passed.

## Guardrails

- Keep server power and console transport, backend permissions, four appearance modes, settings, languages, and game server data unchanged.
- Only real Wings telemetry may appear in operational charts. Reference screenshots and videos remain outside Git.
- No push, deployment, queue processing, EULA change, or work in other repositories.
