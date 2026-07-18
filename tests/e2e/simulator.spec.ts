import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  const start = page.getByRole("button", { name: "Start developing" });
  await start.waitFor({ state: "visible", timeout: 1200 }).catch(() => undefined);
  if (await start.isVisible().catch(() => false)) await start.click();
});

test("applies night mode to the emulator without altering the page", async ({ page }) => {
  const darkToggle = page.getByRole("button", { name: "Dark theme" });
  if (await darkToggle.isVisible()) await darkToggle.click();
  await page.waitForTimeout(250);
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  await expect(page.locator("[data-preview-slot-id]").first().locator(":scope > div").first()).toHaveCSS("background-color", "rgb(21, 25, 34)");
  const frame = page.locator("iframe").first();
  await expect(frame).toHaveCSS("filter", "none");
});

test("shows the simplified navigation controls", async ({ page }) => {
  await expect(page.getByText("Navigation sync", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Page direction")).toHaveCount(0);
  await expect(page.getByLabel("Page color scheme")).toHaveCount(0);
  await expect(page.getByText("Responsive review", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Projects and pages", { exact: true })).toHaveCount(0);
});

test("uses the collapsed sidebar as a clean canvas mode", async ({ page }) => {
  const deviceCount = await page.locator("[data-preview-slot-id]").count();
  await expect(page.locator("[data-main-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(deviceCount);

  await page.getByRole("button", { name: "Collapse workspace setup" }).click();

  await expect(page.locator("[data-main-toolbar]")).toHaveCount(0);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open workspace setup" })).toBeVisible();
  await expect(page.getByRole("separator", { name: "Resize adjacent viewports" })).toHaveCount(Math.max(0, deviceCount - 1));

  await page.getByRole("button", { name: "Open workspace setup" }).click();
  await expect(page.locator("[data-main-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(deviceCount);
});

test("builds an actionable AI fix prompt with optional context", async ({ page }) => {
  await page.getByRole("button", { name: "Copy fix prompt" }).click();
  await expect(page.getByRole("heading", { name: "Generate AI fix prompt" })).toBeVisible();

  const dialog = page.getByLabel("Generate AI fix prompt");
  const copy = dialog.getByRole("button", { name: "Copy fix prompt" });
  await expect(copy).toBeEnabled();
  await page.getByLabel("Issue summary").fill("Navigation overlaps the hero");
  await page.getByLabel("Reproduction steps").fill("Open the page and use Pixel 10.");

  await expect(copy).toBeEnabled();
  await expect(page.getByText("Inspect the existing implementation and styling conventions before editing", { exact: false })).toBeVisible();
  await expect(page.getByText("Run the relevant type, unit, and browser checks", { exact: false })).toBeVisible();
  await expect(dialog.locator("pre")).toContainText("Navigation overlaps the hero");
  await expect(dialog).toContainText("All fields are optional");

  const dialogBox = await dialog.boundingBox();
  const previewBox = await dialog.locator("pre").boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(previewBox!.x).toBeGreaterThanOrEqual(dialogBox!.x);
  expect(previewBox!.x + previewBox!.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width + 1);
});

test("shows a persistent source-tab recording indicator", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: {
        runtime: {
          lastError: undefined,
          sendMessage: (_message: unknown, callback: (response: { ok: boolean }) => void) => callback({ ok: true }),
        },
      },
    });
  });
  await page.goto("/?sourceTabId=17");
  const start = page.getByRole("button", { name: "Start developing" });
  if (await start.isVisible().catch(() => false)) await start.click();

  await page.getByRole("button", { name: "Record source tab" }).click();
  await expect(page.getByRole("status")).toContainText("REC · 00:00 · source tab");
  await expect(page.getByRole("button", { name: /Recording 00:0\d — stop/ })).toBeVisible();
});
