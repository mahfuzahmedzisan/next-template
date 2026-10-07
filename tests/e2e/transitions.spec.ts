import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.clear())
})

test("initial splash settles, records the session, and never leaves content inert", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("[data-transition-layer]")).toHaveAttribute("aria-hidden", "true")
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("mahfuz:splash:v1"))).toBe("shown")
  await expect(page.locator("#content")).not.toHaveAttribute("inert", "")
})

test("eligible internal links use the panel and focus destination content", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => sessionStorage.setItem("mahfuz:splash:v1", "shown"))
  const login = page.locator('a[href="/login"]').first()
  await login.click()
  await expect(page).toHaveURL(/\/login$/)
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
