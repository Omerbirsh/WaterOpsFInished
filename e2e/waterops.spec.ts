import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function signIn(page: import("@playwright/test").Page, target = "/") {
  await page.goto(target)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel("Username").fill("demo")
  await page.locator("#password").fill("demo")
  await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit())
}

test("authenticates and returns to a protected deep link", async ({ page }) => {
  await signIn(page, "/reports/SR-2026-001")
  await expect(page.getByRole("heading", { name: "SR-2026-001" })).toBeVisible()
  const session = await page.evaluate(() => localStorage.getItem("waterops.auth-session.v1"))
  expect(session).not.toContain("password")
})

test("switches between Hebrew and English and keeps the selected language", async ({ page }) => {
  await page.goto("/login")
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole("button", { name: "Switch to Hebrew" }).click()
  await expect(page.getByRole("heading", { name: "ברוכים השבים" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("lang", "he")
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")

  await page.locator("#username").fill("demo")
  await page.locator("#password").fill("demo")
  await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit())
  await expect(page.getByRole("heading", { name: "בוקר טוב, מאיה" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "בוקר טוב, מאיה" })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("waterops.language.v1"))).toBe("he")

  await page.getByRole("button", { name: "החלפה לאנגלית" }).filter({ visible: true }).click()
  await expect(page.getByRole("heading", { name: "Good morning, Maya" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test("navigates the operational workspace and records a decision", async ({ page }, testInfo) => {
  await signIn(page)
  await expect(page.getByRole("heading", { name: "Good morning, Maya" })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("overview.png"), fullPage: true })
  const mobileMenu = page.getByRole("button", { name: "Open navigation" })
  if (await mobileMenu.isVisible()) await mobileMenu.click()
  await page.getByRole("link", { name: /Review Queue/ }).filter({ visible: true }).click()
  await expect(page.getByRole("heading", { name: "Review Queue" })).toBeVisible()
  await expect(page.locator('a[href^="/findings/"]')).toHaveCount(8)
  await page.locator('a[href^="/findings/"]').first().click()
  await page.getByRole("button", { name: "Accept finding" }).click()
  await expect(page.getByRole("button", { name: "Accepted now" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("button", { name: "Accepted now" })).toBeVisible()
})

test("edits staff and preserves the profile", async ({ page }) => {
  await signIn(page, "/team")
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible()
  await page.getByRole("button", { name: "Edit" }).first().click()
  await page.getByLabel("Full name").fill("Maya Chen-Wells")
  await page.getByRole("button", { name: "Save staff profile" }).click()
  await expect(page.getByRole("heading", { name: "Maya Chen-Wells" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Maya Chen-Wells" })).toBeVisible()
})

test("adds a manual source report and preserves it across reloads", async ({ page }) => {
  await signIn(page, "/reports")
  await page.getByRole("link", { name: "Add report" }).click()
  await page.getByRole("button", { name: /Enter manually/ }).click()
  await expect(page.getByRole("heading", { name: "Report information" })).toBeVisible()
  await page.getByLabel("Customer", { exact: false }).selectOption("harbor-grand-hotel")
  await page.getByLabel("Water system", { exact: false }).selectOption("cooling-tower-1")
  await page.getByLabel("Technician", { exact: false }).selectOption("alex-morgan")
  await page.getByRole("button", { name: /Continue to measurements/ }).click()
  await expect(page.getByRole("heading", { name: "Enter measurements" })).toBeVisible()

  const results = page.locator('input[id$="-value"]:visible')
  await expect(results).toHaveCount(4)
  for (const [index, value] of ["1700", "7.8", "31", "0.3"].entries()) await results.nth(index).fill(value)
  await page.getByRole("button", { name: /Review report/ }).click()
  await page.getByRole("button", { name: "Add report", exact: true }).click()
  await expect(page.getByRole("heading", { name: "SR-2026-021" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Report record" })).toBeVisible()

  const workspace = await page.evaluate(() => JSON.parse(localStorage.getItem("waterops.workspace.v1") ?? "{}"))
  expect(workspace.capturedReports).toHaveLength(1)
  expect(workspace.customers[0].systems[0].visits).toHaveLength(8)
  expect(workspace.reports).toHaveLength(20)
  await page.reload()
  await expect(page.getByRole("heading", { name: "SR-2026-021" })).toBeVisible()
})

test("prepares an uploaded PDF for structured review without network work", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await signIn(page, "/reports/new")
  let requests = 0
  page.on("request", (request) => { if (request.resourceType() === "fetch" || request.resourceType() === "xhr") requests += 1 })
  await page.getByRole("button", { name: /Upload report/ }).click()
  await expect(page.getByRole("heading", { name: "Upload report PDF" })).toBeVisible()
  await page.locator("#report-file").setInputFiles({ name: "September_Service_Report.pdf", mimeType: "application/pdf", buffer: Buffer.from("local-pdf-content") })
  await page.getByLabel("Customer", { exact: false }).selectOption("meridian-medical-center")
  await page.getByLabel("Water system", { exact: false }).selectOption("cooling-tower-east")
  await page.getByLabel("Technician", { exact: false }).selectOption("jordan-lee")
  await page.getByRole("button", { name: /Continue to measurements/ }).click()
  await expect(page.getByRole("heading", { name: "Review extracted measurements" })).toBeVisible()
  await expect(page.locator('input[id$="-value"]:visible')).toHaveCount(4)
  expect(requests).toBe(0)
})

test("assistant is local and reports missing model configuration", async ({ page }) => {
  await signIn(page)
  let requests = 0
  page.on("request", (request) => { if (request.resourceType() === "fetch" || request.resourceType() === "xhr") requests += 1 })
  await page.getByRole("button", { name: "Ask WaterOps" }).last().click()
  await page.getByLabel("Ask WaterOps a question").fill("Which systems need review?")
  await page.getByRole("button", { name: "Send question" }).click()
  await expect(page.getByText(/No API key configured yet/)).toBeVisible()
  expect(requests).toBe(0)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
})

test("has no serious accessibility violations or horizontal overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await signIn(page, "/findings")
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  expect(results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
