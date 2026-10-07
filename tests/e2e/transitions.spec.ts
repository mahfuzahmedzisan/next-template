import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.clear())
})

test("initial splash settles, records the session, and never leaves content inert", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("data-splash-active", "true")
  await expect(page.locator("body")).toHaveCSS("visibility", "hidden")
  await expect(page.locator(".initial-splash")).toBeVisible()
  await expect(page.locator("[data-transition-layer]")).toHaveAttribute("data-kind", "splash")
  await expect(page.locator(".initial-splash__logo")).toHaveCount(1)
  await expect(page.locator("[data-transition-layer]")).toHaveAttribute("aria-hidden", "true")
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("mahfuz:splash:v1"))).toBe("shown")
  await expect(page.locator("#content")).not.toHaveAttribute("inert", "")
})

test("eligible internal links dispatch immediately and finish the non-blocking indicator", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("mahfuz:splash:v1", "shown"))
  await page.route("**/login**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.continue()
  })
  await page.goto("/")
  const login = page.locator('a[href="/login"]').first()
  await login.click()
  await expect(page.locator(".initial-splash")).toHaveCSS("display", "none")
  await expect(page.locator(".navigation-loader__label")).toContainText("Navigating")
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator("[data-transition-layer]")).toHaveAttribute("data-kind", "navigation")
  await expect(page.locator("[data-transition-layer]")).toHaveCSS("pointer-events", "none")
  await expect(page.locator("[data-transition-layer]")).toHaveAttribute("aria-hidden", "true")
  await expect(page.locator("#content")).toBeFocused()
})

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" })
  test("uses the same readiness contract without a stuck overlay", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("[data-transition-layer]")).toHaveAttribute("aria-hidden", "true")
  })
})
