import { expect, test } from "@playwright/test";

test("direct visits are content-first with no splash bootstrap", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#content")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("visibility", "visible");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-splash-active",
    /.+/,
  );
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-splash-started-at",
    /.+/,
  );
  await expect(page.locator(".initial-splash")).toHaveCount(0);
  await expect(page.locator("[data-navigation-progress]")).toHaveAttribute(
    "data-active",
    "false",
  );
});

test("direct visits remain readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#content")).toBeVisible();
  await expect(page.locator(".initial-splash")).toHaveCount(0);

  await context.close();
});

test("prefetched navigation does not flash the delayed indicator", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(1_000);
  await page.evaluate(() => {
    const progress = document.querySelector<HTMLElement>(
      "[data-navigation-progress]",
    );
    if (!progress) return;
    (
      window as Window & { __navigationIndicatorBecameVisible?: boolean }
    ).__navigationIndicatorBecameVisible = false;
    const observer = new MutationObserver(() => {
      if (Number.parseFloat(getComputedStyle(progress).opacity) > 0.01) {
        (
          window as Window & { __navigationIndicatorBecameVisible?: boolean }
        ).__navigationIndicatorBecameVisible = true;
      }
    });
    observer.observe(progress, {
      attributes: true,
      attributeFilter: ["style"],
    });
  });

  await page.locator('a[href="/login"]').first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("[data-navigation-progress]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as Window & { __navigationIndicatorBecameVisible?: boolean })
            .__navigationIndicatorBecameVisible,
        ),
      ),
    )
    .toBe(false);
});

test("slow navigation shows non-blocking progress and a delayed status", async ({
  page,
}) => {
  await page.route("**/login**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto("/");

  const navigation = page.locator("[data-navigation-progress]");
  await page.locator('a[href="/login"]').first().click();

  await expect(navigation).toHaveCSS("pointer-events", "none");
  await expect(navigation).toHaveCSS("opacity", "1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-navigation-progress-active",
    /\d+/,
  );
  await expect(page.locator(".navigation-progress__status")).toContainText(
    "Navigating",
  );
  await expect(page.locator("#content")).not.toHaveAttribute("inert", "");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator(".initial-splash")).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
  await expect(navigation).toHaveAttribute("data-active", "false");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-navigation-progress-active",
    /.+/,
  );
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("removes the moving highlight and still settles", async ({ page }) => {
    await page.goto("/");
    await expect
      .poll(() =>
        page
          .locator(".navigation-progress__bar")
          .evaluate((element) => getComputedStyle(element, "::after").display),
      )
      .toBe("none");
    await expect(page.locator("[data-navigation-progress]")).toHaveAttribute(
      "data-active",
      "false",
    );
  });
});
