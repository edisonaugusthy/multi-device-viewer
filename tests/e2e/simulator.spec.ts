import { expect, test, type Page } from "@playwright/test";

async function dismissFirstRunGuide(page: Page) {
  const skipTour = page.getByRole("button", { name: "Skip feature tour" });
  if (await skipTour.isVisible().catch(() => false)) await skipTour.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  const start = page.getByRole("button", { name: "Start developing" });
  await start.waitFor({ state: "visible", timeout: 1200 }).catch(() => undefined);
  if (await start.isVisible().catch(() => false)) await start.click();
  await dismissFirstRunGuide(page);
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

test("opens the latest devices from startup and quick presets", async ({ page }) => {
  await expect(page.locator('[data-device-frame="apple-iphone-17-pro-2025"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-ipad-pro-13-m4-2024"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-macbook-pro-14-m5-2025"]')).toBeVisible();

  await page.getByRole("button", { name: "iOS + Android", exact: true }).click();
  await expect(page.locator('[data-device-frame="apple-iphone-17-pro-2025"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="samsung-galaxy-s26-ultra-2026"]')).toBeVisible();

  await page.getByRole("button", { name: "Phone + tablet", exact: true }).click();
  await expect(page.locator('[data-device-frame="apple-iphone-17-pro-2025"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-ipad-pro-13-m4-2024"]')).toBeVisible();

  await page.getByRole("button", { name: "Mobile + tablet + laptop", exact: true }).click();
  await expect(page.locator('[data-device-frame="apple-iphone-17-pro-2025"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-ipad-pro-13-m4-2024"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-macbook-pro-14-m5-2025"]')).toBeVisible();
});

test("opens sidebar and device screenshots in the annotation editor", async ({ page }) => {
  const viewports = page.locator("[data-preview-slot-id]");
  const viewportCount = await viewports.count();
  expect(viewportCount).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Focus this viewport" })).toHaveCount(0);
  await expect(viewports.getByRole("button", { name: "Screenshot and annotate" })).toHaveCount(viewportCount);

  await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#0f766e";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: {
        runtime: {
          lastError: undefined,
          sendMessage: (_message: unknown, callback: (response: { dataUrl: string }) => void) => {
            callback({ dataUrl: canvas.toDataURL("image/png") });
          },
        },
      },
    });
  });

  await viewports.nth(Math.min(1, viewportCount - 1)).getByRole("button", { name: "Screenshot and annotate" }).click();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  const editorCanvas = page.locator("canvas");
  await expect(editorCanvas).toBeVisible();
  const captureSize = await editorCanvas.evaluate((canvas) => ({ width: canvas.width, height: canvas.height }));
  const windowSize = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  expect(captureSize.width).toBeLessThan(windowSize.width);
  expect(captureSize.height).toBeLessThan(windowSize.height);

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("complementary").getByRole("button", { name: "Screenshot and annotate" }).click();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
});

test("reports a screenshot capture failure instead of leaving a dead button", async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: {
        runtime: {
          lastError: undefined,
          sendMessage: (_message: unknown, callback: (response: { error: string }) => void) => {
            callback({ error: "Capture unavailable" });
          },
        },
      },
    });
  });

  await page.locator("[data-preview-slot-id]").first().getByRole("button", { name: "Screenshot and annotate" }).click();
  await expect(page.getByRole("alert")).toHaveText("No screenshot available");
});

test("keeps favorite controls separate from device selection buttons", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();

  const selection = page.locator('button[title="Apple iPhone 17"]');
  await expect(selection).toBeVisible();
  await expect(selection.locator("button, [role=button]")).toHaveCount(0);
  await expect(selection.locator("xpath=..").getByRole("button", { name: /favorites/ })).toHaveCount(1);

  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("Fold7 unfolded");
  await expect(page.locator('button[title="Samsung Galaxy Z Fold7 (unfolded)"]')).toBeVisible();
});

test("discovers expanded current and rugged device families", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();
  const search = page.getByRole("textbox", { name: "Search name, OS, type, or size" });

  await page.getByRole("tab", { name: /^Android/ }).click();
  await search.fill("XCover7 Pro");
  await expect(page.locator('button[title="Samsung Galaxy XCover7 Pro"]')).toBeVisible();

  await search.fill("");
  await page.getByRole("tab", { name: /^Tablets/ }).click();
  await search.fill("iPad Pro 13 M4");
  await expect(page.locator('button[title="Apple iPad Pro 13-inch (M4)"]')).toBeVisible();

  await search.fill("");
  await page.getByRole("tab", { name: /^Laptops/ }).click();
  await search.fill("MacBook Air 13 inch");
  await expect(page.locator('button[title="Apple MacBook Air 13 inch"]')).toBeVisible();
});

test("renders every reported problem device with its verified viewport inside the frame", async ({ page }) => {
  const reportedDevices = [
    ["Pixel 10 Pro XL", "Google Pixel 10 Pro XL", "google-pixel-10-pro-xl-2025", 448, 997],
    ["Motorola Edge 60 Pro", "Motorola Edge 60 Pro", "motorola-edge-60-pro-2025", 407, 904],
    ["XCover7 Pro", "Samsung Galaxy XCover7 Pro", "samsung-galaxy-xcover7-pro-2025", 360, 803],
    ["Galaxy Z Flip7", "Samsung Galaxy Z Flip7", "samsung-galaxy-z-flip7-2025", 360, 840],
    ["Galaxy Z Fold7", "Samsung Galaxy Z Fold7 (unfolded)", "samsung-galaxy-z-fold7-unfolded-2025", 874, 787],
    ["OnePlus Nord 2", "OnePlus Nord 2", "oneplus-nord-2", 412, 915],
    ["MacBook Pro 14", "Apple MacBook Pro 14-inch (M5)", "apple-macbook-pro-14-m5-2025", 1512, 982],
    ["Modern Laptop 15", "Modern Laptop 15 inch", "modern-laptop-15", 1440, 900],
    ["Surface", "Microsoft Surface Laptop 13.8-inch (8th Edition)", "microsoft-surface-laptop-8-13-8-2026", 1152, 768],
    ["iPhone 16e", "Apple iPhone 16e", "apple-iphone-16e-2025", 390, 844],
    ["iPhone 16 Pro", "Apple iPhone 16 Pro", "apple-iphone-16-pro-2024", 402, 874],
  ] as const;

  const slot = page.locator("[data-preview-slot-id]").first();
  for (const [query, name, id, width, height] of reportedDevices) {
    await page.getByTestId("device-switcher-button").first().click();
    await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill(query);
    await page.locator(`button[title="${name}"]`).click();

    const frame = slot.locator(`[data-device-frame="${id}"]`);
    const screen = slot.locator(`[data-device-screen="${id}"]`);
    await expect(frame, `${name} frame`).toBeVisible();
    await expect(screen, `${name} screen`).toBeVisible();
    await expect(slot).toContainText(`${width} × ${height}`);

    const frameBox = await frame.boundingBox();
    const screenBox = await screen.boundingBox();
    expect(frameBox, `${name} frame bounds`).not.toBeNull();
    expect(screenBox, `${name} screen bounds`).not.toBeNull();
    expect(screenBox!.x, `${name} screen left`).toBeGreaterThanOrEqual(frameBox!.x - 1);
    expect(screenBox!.y, `${name} screen top`).toBeGreaterThanOrEqual(frameBox!.y - 1);
    expect(screenBox!.x + screenBox!.width, `${name} screen right`).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
    expect(screenBox!.y + screenBox!.height, `${name} screen bottom`).toBeLessThanOrEqual(frameBox!.y + frameBox!.height + 1);
  }
});

test("keeps the Galaxy Z Flip7 camera hole inside the display in both orientations", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();
  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("Galaxy Z Flip7");
  await page.locator('button[title="Samsung Galaxy Z Flip7"]').click();

  const slot = page.locator("[data-preview-slot-id]").first();
  const frame = slot.locator('[data-device-frame="samsung-galaxy-z-flip7-2025"]');
  const screen = slot.locator('[data-device-screen="samsung-galaxy-z-flip7-2025"]');
  const expectScreenInsideFrame = async () => {
    const frameBox = await frame.boundingBox();
    const screenBox = await screen.boundingBox();
    expect(frameBox).not.toBeNull();
    expect(screenBox).not.toBeNull();
    expect(screenBox!.x).toBeGreaterThanOrEqual(frameBox!.x - 1);
    expect(screenBox!.y).toBeGreaterThanOrEqual(frameBox!.y - 1);
    expect(screenBox!.x + screenBox!.width).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
    expect(screenBox!.y + screenBox!.height).toBeLessThanOrEqual(frameBox!.y + frameBox!.height + 1);
  };

  await expect(screen).toHaveCSS("clip-path", /path\(/);
  await expectScreenInsideFrame();
  await page.getByRole("button", { name: "Rotate" }).first().click();
  await expect(slot).toContainText("840 × 360");
  await expect(screen).toHaveCSS("clip-path", /path\(/);
  await expectScreenInsideFrame();
});

test("keeps the Pixel 10a display and Android status row balanced inside its frame", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();
  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("Pixel 10a");
  await page.locator('button[title="Google Pixel 10a"]').click();

  const slot = page.locator("[data-preview-slot-id]").first();
  const frame = slot.locator('[data-device-frame="google-pixel-10a-2026"]');
  const screen = slot.locator('[data-device-screen="google-pixel-10a-2026"]');
  const time = slot.getByText("9:41", { exact: true });
  await expect(frame).toBeVisible();
  await expect(screen).toBeVisible();
  await expect(time).toBeVisible();

  const frameBox = await frame.boundingBox();
  const screenBox = await screen.boundingBox();
  const timeBox = await time.boundingBox();
  expect(frameBox).not.toBeNull();
  expect(screenBox).not.toBeNull();
  expect(timeBox).not.toBeNull();

  const leftInset = screenBox!.x - frameBox!.x;
  const rightInset = frameBox!.x + frameBox!.width - screenBox!.x - screenBox!.width;
  const topInset = screenBox!.y - frameBox!.y;
  const bottomInset = frameBox!.y + frameBox!.height - screenBox!.y - screenBox!.height;
  expect(Math.abs(leftInset - rightInset)).toBeLessThanOrEqual(3);
  expect(Math.abs(topInset - bottomInset)).toBeLessThanOrEqual(3);
  expect(timeBox!.x).toBeGreaterThanOrEqual(screenBox!.x);
  expect(timeBox!.y).toBeGreaterThanOrEqual(screenBox!.y);
  expect(timeBox!.x + timeBox!.width).toBeLessThanOrEqual(screenBox!.x + screenBox!.width);
  expect(timeBox!.y + timeBox!.height).toBeLessThanOrEqual(screenBox!.y + screenBox!.height);
});

test("aligns the iPhone 17e Liquid Glass header color with its notch opening", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();
  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("iPhone 17e");
  await page.locator('button[title="Apple iPhone 17e"]').click();

  const slot = page.locator("[data-preview-slot-id]").first();
  const frame = slot.locator('[data-device-frame="apple-iphone-17e-2026"]');
  const screen = slot.locator('[data-device-screen="apple-iphone-17e-2026"]');
  const topSurface = slot.locator('[data-ios-top-surface="apple-iphone-17e-2026"]');
  await expect(frame).toBeVisible();
  await expect(screen).toBeVisible();
  await expect(topSurface).toBeVisible();

  const preview = slot.locator("iframe");
  const frameName = await preview.getAttribute("name");
  const slotId = frameName?.replace("mdv-mobile-preview-", "");
  expect(slotId).toBeTruthy();
  const previewHandle = await preview.elementHandle();
  const previewFrame = await previewHandle?.contentFrame();
  expect(previewFrame).not.toBeNull();
  await previewFrame!.evaluate((currentSlotId) => {
    window.parent.postMessage({
      type: "MDV_PAGE_SURFACE_COLORS",
      slotId: currentSlotId,
      topColor: "rgb(18, 96, 180)",
      bottomColor: "rgb(240, 240, 242)",
      topIsDark: true,
      bottomIsDark: false,
    }, "*");
  }, slotId!);

  await expect(topSurface).toHaveCSS("background-color", "rgb(18, 96, 180)");
  const screenBox = await screen.boundingBox();
  const surfaceBox = await topSurface.boundingBox();
  expect(screenBox).not.toBeNull();
  expect(surfaceBox).not.toBeNull();
  expect(Math.abs(surfaceBox!.x - screenBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(surfaceBox!.width - screenBox!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(surfaceBox!.y - screenBox!.y)).toBeLessThanOrEqual(1);
});

test("keeps the Modern Laptop display below the webcam and uses Windows browser controls", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();
  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("Modern Laptop 15");
  await page.locator('button[title="Modern Laptop 15 inch"]').click();

  const slot = page.locator("[data-preview-slot-id]").first();
  const frame = slot.locator('[data-device-frame="modern-laptop-15"]');
  const screen = slot.locator('[data-device-screen="modern-laptop-15"]');
  await expect(frame).toBeVisible();
  await expect(screen).toBeVisible();
  await expect(slot.locator('[data-desktop-chrome="windows"]')).toBeVisible();
  await expect(slot.getByRole("button", { name: "Rotate" })).toHaveCount(0);

  const frameBox = await frame.boundingBox();
  const screenBox = await screen.boundingBox();
  expect(frameBox).not.toBeNull();
  expect(screenBox).not.toBeNull();
  expect(screenBox!.x).toBeGreaterThan(frameBox!.x);
  expect(screenBox!.y).toBeGreaterThan(frameBox!.y);
  expect(screenBox!.x + screenBox!.width).toBeLessThan(frameBox!.x + frameBox!.width);
  expect(screenBox!.y + screenBox!.height).toBeLessThan(frameBox!.y + frameBox!.height);
});

test("keeps native-landscape foldables and their hardware inside the preview canvas", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();
  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("Fold7");
  await page.locator('button[title="Samsung Galaxy Z Fold7 (unfolded)"]').click();

  const frame = page.locator('[data-device-frame="samsung-galaxy-z-fold7-unfolded-2025"]');
  const screen = page.locator('[data-device-screen="samsung-galaxy-z-fold7-unfolded-2025"]');
  await expect(frame).toBeVisible();
  await expect(screen).toBeVisible();
  await expect(screen).toHaveCSS("clip-path", /path\(/);

  const frameBox = await frame.boundingBox();
  const canvasBox = await frame.locator("xpath=ancestor::*[@data-design-overlay-surface]").boundingBox();
  expect(frameBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(frameBox!.x).toBeGreaterThanOrEqual(canvasBox!.x - 1);
  expect(frameBox!.y).toBeGreaterThanOrEqual(canvasBox!.y - 1);
  expect(frameBox!.x + frameBox!.width).toBeLessThanOrEqual(canvasBox!.x + canvasBox!.width + 1);
  expect(frameBox!.y + frameBox!.height).toBeLessThanOrEqual(canvasBox!.y + canvasBox!.height + 1);
});

test("does not report standalone previews as blocked when no extension bridge is present", async ({ page }) => {
  await expect(page.locator("iframe").first()).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.getByText("This site blocks iframe preview.")).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeVisible();
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
  await page.getByRole("button", { name: "Generate AI fix prompt" }).click();
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
  await dismissFirstRunGuide(page);

  await page.getByRole("button", { name: "Screen record" }).click();
  await expect(page.getByRole("status")).toContainText("Screen recording in progress · 00:00");
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
});

test("reruns a saved flow without refreshing the previews", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("mdvRecordedFlow", JSON.stringify([
      { id: "step-1", kind: "input", selector: "#email", value: "person@example.com" },
      { id: "step-2", kind: "click", selector: "#continue" },
    ]));
  });
  await page.reload();
  const start = page.getByRole("button", { name: "Start developing" });
  if (await start.isVisible().catch(() => false)) await start.click();
  await dismissFirstRunGuide(page);

  const originalPreview = page.locator("iframe").first();
  await originalPreview.evaluate((iframe) => iframe.setAttribute("data-replay-preview", "original"));
  await page.getByRole("button", { name: "Rerun · 2 steps", exact: true }).click();
  await page.waitForTimeout(400);

  await expect(page.locator('iframe[data-replay-preview="original"]')).toHaveCount(1);
});
