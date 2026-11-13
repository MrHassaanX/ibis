import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const report = [];
for (const [route, width, theme] of [
  ["/", 1440, "dark"],
  ["/", 390, "dark"],
  ["/", 1440, "light"],
  ["/demo", 390, "dark"],
  ["/docs", 390, "dark"],
  ["/brand", 390, "dark"],
]) {
  await page.setViewportSize({ width, height: 950 });
  await page.goto(`http://127.0.0.1:3000${route}`);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (theme === "light") await page.getByLabel("Use light theme").click();
  for (const section of await page.locator("section,footer").all()) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `qa/${route === "/" ? "hero" : route.slice(1)}-${width}-${theme}.png`,
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  report.push({
    route,
    width,
    theme,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    violations: results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
  if (route === "/") {
    await page.locator("#studio").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `qa/studio-${width}-${theme}.png` });
  }
}
await writeFile("qa/accessibility.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
