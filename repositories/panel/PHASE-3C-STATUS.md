# Phase 3C status: reference audit and capability foundation

Date: 2026-11-03. This is the first validated milestone of a larger Phase 3C implementation. Loader, region display, announcements, Minecraft properties/plugins/mods, glass styling, and banners remain pending. No third-party addon was installed or copied into the product.

## Private reference audit

The owner-provided bundle was extracted to `../references/addons` outside all Git repositories. The seven nested archives were inspected as ZIP contents only; their installation scripts were not executed. The bundle's `READ_ME_FIRST.txt` describes the intended functional references. Static inventory found:

| Archive | Observed packaging | Functional reference only |
| --- | --- | --- |
| `loader.zip` | Legacy Pterodactyl patch files and install scripts | Custom loader settings |
| `Drift Properties.zip` | Packaged v2 `.pteroext` | Structured Minecraft properties editing |
| `Drift Mods.zip` | Packaged v2 `.pteroext` | Mod catalog and managed installation |
| `Drift_PluginsV1_5.zip` | Packaged `.pterext` | Plugin catalog and per-Egg visibility |
| `regiondisplay-1.0.1.zip` | Packaged v2 `.pteroext`; nested flag artwork license file | Administrator-defined regions and badges |
| `layeredy-announce-for-pterodactyl.zip` | Blueprint addon | First-party announcements without Blueprint/account dependency |
| `arix-v1.3.1.zip` | Older theme tree | Visual reference for restrained glass surfaces and banners only |

No blanket reuse or redistribution license for these seven whole packages was established. The nested region package includes a flag artwork license file, which does not grant reuse rights for the entire extension. No package source, artwork, CSS, or sound was imported. The Panel's existing MIT-based Pterodactyl source remains the implementation foundation.

The requested marketplace URL `https://pterodactyl.io/marketplace?page=2&product=131026` was not accessible through the research tool, and independent search did not establish a matching product identity. Its title, author, capabilities, compatibility, and license are unverified; its functionality is deferred.

## Existing architecture and capability decision

The Panel already has Egg tags, inherited Egg features, administrator editing for both, extension screen predicates, a client server resource, and navigation predicates. There are no native implementations of the seven requested product features. The capability resolver reuses Egg metadata and adds no table or migration.

`ServerCapabilities` recognizes an explicit allowlist: `minecraft.java`, `minecraft.bedrock`, `minecraft.properties`, `minecraft.plugins`, `minecraft.mods`, `service.http`, and `service.background-worker`. Minecraft Java tools require both the `minecraft` Egg tag and an explicit `minecraft.java` Egg feature. Properties, Plugins, and Mods require their own feature declarations. A `bedrock` tag blocks Java tools even if an Egg accidentally declares them. Unknown Eggs and display names alone grant nothing. Administrators can classify compatible custom Eggs in the existing Egg Tags and Features controls; no source edit is needed.

The client server resource now exposes resolved capabilities. Core navigation metadata can require one, in addition to existing subuser permissions. A backend `require()` guard raises an authorization error for unsupported operations. Future feature controllers must call this guard after normal permission checks; there are no Phase 3C feature endpoints yet. The client capability array is a display aid, never an authorization boundary.

## Validation and limits

Targeted PHP resolver and client resource tests passed (11 tests, 27 assertions). The frontend navigation test passed (5 tests), along with TypeScript, targeted lint/format checks, OpenAPI contract tests, and a Vite build in the WSL Panel checkout. The tests cover conservative unknown Eggs, explicit Java tools, Bedrock exclusion, non-Minecraft workloads, the backend guard, API serialization, and navigation gating. Real Minecraft file handling and direct feature endpoint denial are not yet testable because those endpoints have not been implemented.

The live Client API returned `capabilities: []` for existing Mumble server ID 4 and Node.js HTTP server ID 5. Their navigation had no Minecraft entries. At 1440, 1024, 768, and 390 pixels, the Node.js console had no horizontal overflow or browser page errors. Mumble was also checked at 390 pixels. Private screenshots are in `../references/phase3c-validation/` outside Git. Mumble server ID 4 and Node.js server ID 5 were not modified. Docker, Wings, MariaDB, Redis, and the Panel remained active; no migrations or external service dependencies were added.

Next milestones: B (loader, regions, announcements), C (properties editor), D (safe catalog/download infrastructure and plugin/mod managers), E (appearance), F (full integration and responsive/browser regression). Each needs its own implementation and validation before Phase 3C can be called complete.
