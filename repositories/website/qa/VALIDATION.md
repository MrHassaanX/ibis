# Phase 1 validation

Validated locally on Windows with Node 24.22.1, pnpm 11.25.0 and headless Microsoft Edge. No production deployment or remote push.

## Checks

- `pnpm typecheck`: passed strict TypeScript checking.
- `pnpm lint`: passed the Next.js core-web-vitals / TypeScript rules.
- `pnpm build`: passed production compilation and static prerendering for `/`, `/demo`, `/docs`, `/brand`, `/robots.txt`, `/sitemap.xml` and the not-found page.
- `pnpm test`: four browser tests passed. These cover viewport widths 1440, 1024, 768 and 390; document overflow; mobile navigation; console and power simulation; dashboard views and files; all Studio control categories and reset; filtering; FAQ; metadata routes; and reduced-motion rendering.
- `node qa/audit.mjs`: six additional route/viewport/theme combinations have no detected WCAG A/AA violations or document overflow. The machine-readable results are retained in `qa/accessibility.json`.
- All five original PNGs match the supplied ZIP and recorded manifest by SHA-256.
- A final production-server smoke check loaded all four pages without browser console errors, page exceptions or hydration errors.

## Issues found and corrected

- An atmospheric hero layer extended 8px past the tablet viewport; its bounds now stay within the layout.
- Resource-card icon styles accidentally inherited chart dimensions; icons now retain their intended size.
- Dark asset backgrounds initially produced distracting rectangles; CSS compositing and background treatments were refined while keeping originals intact.
- Contrast checks identified console timestamps, installation step numbers and several light-theme labels; foreground tokens were adjusted and audited again.
- File dialogs now restore keyboard focus to their opener after Escape or Close.
- Initial package selection produced unsupported ESLint/TypeScript peer combinations; the compatible versions were selected and locked. ESLint 9 is the compatible line for the current Next plugin dependency set, and its upstream deprecation warning remains a tooling maintenance item. It is not shipped to website visitors.

## Visual review

Generated and inspected actual rendered output, including full homepage captures at the four target widths, the desktop hero, desktop and mobile Studio, light appearance, and the dedicated demo. The original recording was sampled locally to understand the reference experience; no frames are shipped as website content.

Screenshots are local QA outputs ignored by Git: `qa/home-{width}.png`, `qa/hero-1440-dark.png`, `qa/hero-1440-light.png`, `qa/studio-1440-dark.png`, `qa/studio-390-dark.png`, and `qa/demo-desktop.png`. Regenerate through the test suite and audit helper while the local server is running.

## Boundaries

Automated accessibility checks do not replace manual screen-reader testing. Safari, Firefox, physical-device performance and a production-domain deployment have not been validated. The website is entirely a simulation and presentation layer. Existing source foundation, future workload workflows, installer and migration status remain clearly distinguished. All other IbisPanel repositories retain their Phase 0 commits and working trees.
