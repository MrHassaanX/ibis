# IbisPanel website

The independent public website for IbisPanel. This is a presentation application, separate from the hosting-management panel. All workload metrics, console activity, server controls and customization previews run locally in the browser with synthetic data. There are no Wings connections, shell execution, accounts or migration endpoints.

## Run locally

Use Node.js 22.12+ (validated with 24.22.1) and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:3000. For a production build use `pnpm build`, then `pnpm start`.

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

The browser tests use an installed Microsoft Edge browser. Change `channel` in `playwright.config.ts` to a locally available Playwright browser for other environments. Start the local server before running tests. `node qa/audit.mjs` collects additional accessibility results and viewport screenshots. Do not run two test processes concurrently because they share their output directory.

## Architecture

- Next.js 16 App Router, React 19, strict TypeScript. Marketing content is rendered in server components; the header, dashboard, Studio, catalog filtering and small scroll-reveal controller are client components.
- `src/app/page.tsx`: ten homepage narrative sections, architecture illustration, migration flow, installation overview, repository links and FAQ.
- `/demo`: full simulated product exploration plus Studio.
- `/docs`: honest foundation status and manual installation guidance, without unverified executable commands.
- `/brand`: all five supplied original brand variants and original PNG downloads.
- `src/components/Dashboard.tsx`: workload selector, resource charts, eight view states, simulated console and power controls, and read-only sample file previews.
- `src/components/Studio.tsx`: seven functional customization controls plus selectable server previews. State is intentionally session-local and does not persist across reloads.
- `src/lib/content.ts`: synthetic workloads, FAQ copy and official repository references.
- `src/app/globals.css`: design tokens, components and responsive compositions. `refinements.css` contains final shared visual and contrast corrections. Native CSS handles motion; neither Tailwind nor a JavaScript animation library is needed for this scope.
- Self-hosted Geist / Geist Mono fonts through Fontsource. Lucide supplies interface icons; it does not replace the official ibis logo.

## Brand assets

The five original PNGs are retained byte-for-byte in `public/brand`. `asset-manifest.json` records original dimensions and SHA-256 hashes. `pnpm assets` produces proportional, optimized WebP versions, a favicon and social image; it does not redraw or extract a replacement silhouette. Dark variants use CSS contrast/screen compositing to suppress their opaque navy backgrounds on dark surfaces. The brand gallery intentionally retains original backgrounds. Light-mode navigation uses a deliberate dark brand plaque.

Inspect visual output before adjusting brand filters: they are presentation treatments, not a claim that the original PNGs have transparency. The original asset guide is retained as provenance; user requirements govern how the assets are used.

## Design and content

The visual direction combines midnight navy, electric cyan, large editorial typography, technical detail and restrained depth. The hero introduces a working console composition; the showcase exposes more views; Studio gives visitors direct control over the design. Sections use different compositions rather than one repeated card grid.

Primary research: [Pterodactyl](https://pterodactyl.io/), [Reviactyl](https://reviactyl.app/) and [Pelican](https://pelican.dev/), plus the supplied recording. References informed interactive product presentation, customization and documentation hierarchy. No reference-site code, screenshots, logos or artwork are shipped.

The site distinguishes the inherited Pterodactyl foundation from future IbisPanel features. Migration adapters, automated installation, Studio integration and tailored universal workload flows are explicitly planned. Public repository links use real roots because locally completed Phase 0 documents may not yet be published. There are no invented statistics, sponsors, testimonials, marketplace downloads or installation commands.

## Accessibility and performance

Semantic landmarks, labeled controls, pressed states, native FAQ disclosures, keyboard focus styles, a skip link and reduced-motion rules are included. Console announcements are bounded; animation timers stop at the final initial log line. Fonts are self-hosted, logo derivatives are sized, noncritical images use Next image lazy loading, and page routes are statically prerendered.

Playwright checks the homepage at 1440, 1024, 768 and 390px and verifies no document overflow, navigation, simulations, Studio state changes, reset, filtering, FAQ and metadata endpoints. Axe checks are automated evidence, not a full manual screen-reader certification. See `qa/VALIDATION.md` and `qa/accessibility.json` for results and limitations.

## SEO and deployment boundary

Set `NEXT_PUBLIC_SITE_URL` to the actual approved HTTPS origin before building a deployed version. Metadata, Open Graph, Twitter cards, sitemap and robots are implemented. Without that variable, the local build uses localhost metadata and disables indexing intentionally. No production domain is assumed. The social preview uses the supplied horizontal brand artwork.

This phase is local only: no push, hosting registration or deployment. The other six IbisPanel repositories are untouched. The website remote was empty when inspected, so this creates its first commit and an MIT source license. Third-party dependencies retain their own licenses; the MIT code license does not grant exclusive rights or endorsement over upstream marks.

## Remaining release gates

Confirm the final domain, publish the approved documentation, validate on Firefox/Safari and physical devices, and review branding and copy before deployment. A real management demo would require separate infrastructure, authentication, isolation and security work. Do not wire this preview's controls to production APIs.
