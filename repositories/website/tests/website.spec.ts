import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("responsive layouts and accessibility", async ({ page }) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "One panel. Every workload." }),
    ).toBeVisible();
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `qa/home-${width}.png`, fullPage: true });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Docs" })
    .click();
  await expect(page).toHaveURL(/\/docs/);
});
test("workloads, power, console and files are interactive simulations", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Discord bot", exact: true }).click();
  await expect(page.locator(".server-heading")).toContainText(
    "Community companion",
  );
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator(".server-heading")).toContainText("Stopped");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".server-heading")).toContainText("Running");
  await page.getByLabel("Simulated console command").fill("help");
  await page.getByLabel("Send simulated command").click();
  await expect(page.getByRole("log")).toContainText("No command executed");
  for (const view of ["Backups", "Schedules", "Network", "Users", "Admin"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await expect(page.locator(".data-view")).toContainText(
      "Illustrative records",
    );
  }
  await page.getByRole("button", { name: "Files", exact: true }).click();
  await page.getByRole("button", { name: /package.json/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("every Studio control updates the preview and reset restores defaults", async ({
  page,
}) => {
  await page.goto("/demo");
  const studio = page.locator(".studio-workbench");
  const preview = page.getByTestId("studio-preview");
  await studio.getByRole("button", { name: "light", exact: true }).click();
  await expect(preview).toHaveClass(/light/);
  await studio.getByRole("button", { name: "Violet accent" }).click();
  await expect(preview).toHaveAttribute("style", /rgb|#b0a0ff/);
  await studio.getByRole("button", { name: "list", exact: true }).click();
  await expect(preview.locator(".studio-servers")).toHaveClass(/layout-list/);
  await studio.getByRole("button", { name: "classic", exact: true }).click();
  await expect(preview).toHaveClass(/nav-classic/);
  await studio.getByRole("button", { name: "Round", exact: true }).click();
  await expect(preview).toHaveAttribute("style", /22px/);
  await studio
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: "Density" }) })
    .getByRole("button", { name: "compact", exact: true })
    .click();
  await expect(preview).toHaveClass(/density-compact/);
  await studio.getByRole("button", { name: "Reset to defaults" }).click();
  await expect(preview).toHaveClass(/dark nav-modern density-comfortable/);
  await page.screenshot({ path: "qa/demo-desktop.png", fullPage: true });
});
test("catalog filtering, FAQ, routes, metadata and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .locator(".catalog-filters")
    .getByRole("button", { name: "Themes", exact: true })
    .click();
  await expect(page.locator(".ecosystem-card")).toHaveCount(1);
  await page
    .locator("summary")
    .filter({ hasText: "Can I migrate from another panel?" })
    .click();
  await expect(
    page.getByText("A Migration Hub is designed", { exact: false }),
  ).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /social.png/,
  );
  for (const route of [
    "/docs",
    "/brand",
    "/demo",
    "/sitemap.xml",
    "/robots.txt",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
  }
});
