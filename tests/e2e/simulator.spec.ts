import { expect, test, type Page } from "@playwright/test";

async function dismissFirstRunGuide(page: Page) {
  const skipTour = page.getByRole("button", { name: "Skip feature tour" });
  if (await skipTour.isVisible().catch(() => false)) await skipTour.click();
}

async function openTools(page: Page) {
  const open = page.getByRole("button", { name: "Open workspace setup", exact: true });
  if (await open.isVisible()) await open.click();
}

async function openViewportActions(page: Page, index = 0) {
  const close = page.getByRole("button", { name: "Collapse workspace setup", exact: true });
  if (await close.isVisible()) await close.click();
  const toggle = page.locator("[data-preview-slot-id]").nth(index).getByRole("button", { name: "Viewport options", exact: true });
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  const start = page.getByRole("button", { name: "Start developing" });
  await start.waitFor({ state: "visible", timeout: 1200 }).catch(() => undefined);
  if (await start.isVisible().catch(() => false)) await start.click();
  await dismissFirstRunGuide(page);
});

test("passes night mode to the preview without applying a color filter", async ({ page }) => {
  const darkToggle = page.getByRole("button", { name: "Dark theme" });
  if (await darkToggle.isVisible()) await darkToggle.click();
  await page.waitForTimeout(250);
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  await expect(page.locator("[data-preview-slot-id]").first().locator(":scope > div").first()).toHaveCSS("background-color", "rgb(21, 25, 34)");
  const frame = page.locator("iframe").first();
  await expect(frame).toHaveCSS("color-scheme", "dark");
  await expect(frame).toHaveCSS("filter", "none");
});

test("shows the simplified navigation controls", async ({ page }) => {
  await openTools(page);
  await expect(page.locator("[data-main-toolbar]").getByRole("button", { name: "Navigation sync", exact: true })).toBeVisible();
  await expect(page.getByLabel("Page direction")).toHaveCount(0);
  await expect(page.getByLabel("Page color scheme")).toHaveCount(0);
  await expect(page.getByText("Responsive review", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Projects and pages", { exact: true })).toHaveCount(0);
});

test("opens the latest devices from startup and quick presets", async ({ page }) => {
  await expect(page.locator('[data-device-frame="apple-iphone-18-pro-2026"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-ipad-pro-13-m4-2024"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-macbook-pro-14-m5-2025"]')).toBeVisible();

  await openTools(page);
  await page.getByRole("button", { name: "iOS + Android", exact: true }).click();
  await expect(page.locator('[data-device-frame="apple-iphone-18-pro-2026"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="samsung-galaxy-s26-ultra-2026"]')).toBeVisible();

  await page.getByRole("button", { name: "Phone + tablet", exact: true }).click();
  await expect(page.locator('[data-device-frame="apple-iphone-18-pro-2026"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-ipad-pro-13-m4-2024"]')).toBeVisible();

  await page.getByRole("button", { name: "Mobile + tablet + laptop", exact: true }).click();
  await expect(page.locator('[data-device-frame="apple-iphone-18-pro-2026"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-ipad-pro-13-m4-2024"]')).toBeVisible();
  await expect(page.locator('[data-device-frame="apple-macbook-pro-14-m5-2025"]')).toBeVisible();
});

test("opens toolbar and device screenshots without duplicate Tools actions", async ({ page }) => {
  const viewports = page.locator("[data-preview-slot-id]");
  const viewportCount = await viewports.count();
  expect(viewportCount).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Focus this viewport" })).toHaveCount(0);
  await expect(viewports.getByRole("button", { name: "Screenshot and annotate", includeHidden: true })).toHaveCount(viewportCount);

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

  await openViewportActions(page, Math.min(1, viewportCount - 1));
  await viewports.nth(Math.min(1, viewportCount - 1)).getByRole("button", { name: "Screenshot and annotate" }).click();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  const editorCanvas = page.locator("canvas");
  await expect(editorCanvas).toBeVisible();
  const captureSize = await editorCanvas.evaluate((canvas) => ({ width: canvas.width, height: canvas.height }));
  const windowSize = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  expect(captureSize.width).toBeLessThan(windowSize.width);
  expect(captureSize.height).toBeLessThan(windowSize.height);

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await openTools(page);
  await expect(page.getByRole("complementary").getByRole("button", { name: "Screenshot and annotate" })).toHaveCount(0);
  await expect(page.getByRole("complementary").getByRole("button", { name: "Start a new check" })).toHaveCount(0);
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Screenshot and annotate" }).click();
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

  await openViewportActions(page);
  await page.locator("[data-preview-slot-id]").first().getByRole("button", { name: "Screenshot and annotate" }).click();
  await expect(page.getByRole("alert")).toHaveText("Capture unavailable");
});

test("keeps favorite controls separate from device selection buttons", async ({ page }) => {
  await page.getByTestId("device-switcher-button").first().click();

  const selection = page.locator('button[title="Apple iPhone 17"]');
  await expect(selection).toBeVisible();
  await expect(selection.locator("button, [role=button]")).toHaveCount(0);
  await expect(selection.locator("xpath=..").getByRole("button", { name: /favorites/ })).toHaveCount(1);

  await selection.locator("xpath=..").getByRole("button", { name: /favorites/ }).click();
  await expect(selection).toHaveCount(1);
  await expect(selection.locator("xpath=..").getByRole("button", { name: /favorites/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("device-switcher-panel")).toHaveCount(0);
  await expect(page.getByTestId("device-switcher-button").first()).toBeFocused();
  await page.getByTestId("device-switcher-button").first().click();

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
  await openViewportActions(page);
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

test("seals translucent pinned headers on the new iPhones without sealing transparent or scrolling content", async ({ page }) => {
  await page.locator("[data-preview-slot-id]").first().waitFor();
  await page.evaluate(() => {
    const url = `${location.origin}/scripts/header-seam-audit/translucent.html`;
    localStorage.setItem("mdvSimulatorSession", JSON.stringify({
      slots: ["apple-iphone-18-pro-2026", "apple-iphone-18-pro-max-2026", "apple-iphone-duo-folded-2026", "apple-iphone-duo-unfolded-2026"].map((deviceId, i) => ({
        id: `glass-${i}`, deviceId, url, orientation: "portrait", zoom: .58, zoomMode: "fit", reloadToken: 0, showFrame: true,
      })),
      activeSlotId: "glass-0", display: { scrollSync: false, navigationSync: false, darkMode: false, previewStyle: "device" },
    }));
  });
  await page.goto("/entrypoints/preview/index.html");
  const cards = page.locator("[data-preview-slot-id]");
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) {
    const top = card.locator('[data-preview-edge="top"]');
    const bottom = card.locator('[data-preview-edge="bottom"]');
    await expect(top).toHaveCSS("background-color", "rgb(3, 7, 18)");
    await expect(bottom).toHaveCSS("background-color", "rgb(3, 7, 18)");
    const frame = await (await card.locator("iframe").elementHandle())!.contentFrame();
    await frame!.evaluate(() => window.scrollTo(0, 130));
    await expect(top).toHaveCSS("background-color", "rgb(3, 7, 18)");
    await frame!.getByPlaceholder("Search demo").fill("header stays interactive");
    await expect(frame!.getByPlaceholder("Search demo")).toHaveValue("header stays interactive");

    await frame!.evaluate(() => { document.querySelector("header")!.style.backgroundColor = "rgb(3 7 18 / .5)"; });
    await expect(top).toHaveCount(0);
    await frame!.evaluate(() => { document.querySelector("header")!.style.backgroundColor = "rgb(3 7 18 / .95)"; });
    await expect(top).toHaveCount(1);
    await frame!.evaluate(() => { document.querySelector("header")!.style.position = "static"; });
    await expect(top).toHaveCount(0);
  }
});

for (const model of ["iPhone 18 Pro", "iPhone 18 Pro Max"]) {
  test(`${model} follows page surface colors through scrolling and rotation`, async ({ page }) => {
    await page.getByTestId("device-switcher-button").first().click();
    await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill(model);
    await page.locator(`button[title="Apple ${model}"]`).click();
    const slot = page.locator("[data-preview-slot-id]").first();
    const iframe = slot.locator("iframe");
    const top = slot.locator("[data-ios-top-surface]");
    const bottom = slot.locator("[data-ios-bottom-surface]");
    const address = slot.locator('[data-browser-control="bottom-address"]');

    for (let rotation = 0; rotation < 2; rotation++) {
      if (rotation) {
        await openViewportActions(page);
        await slot.getByRole("button", { name: "Rotate", exact: true }).click();
      }
      const embedded = await (await iframe.elementHandle())!.contentFrame();
      // Exercise the real iframe-to-preview message boundary. Swap light/dark
      // edges while scrolling so neither chrome surface can use the shell theme.
      for (const collapsed of [false, true]) {
        const colors = collapsed
          ? { topColor: "rgb(242, 231, 218)", bottomColor: "rgb(92, 24, 47)", topIsDark: false, bottomIsDark: true }
          : { topColor: "rgb(18, 96, 180)", bottomColor: "rgb(240, 240, 242)", topIsDark: true, bottomIsDark: false };
        await embedded!.evaluate(({ colors, collapsed }) => {
          const slotId = window.name.replace(/^mdv-(?:mobile-)?preview-/, "");
          parent.postMessage({ type: "MDV_PAGE_SURFACE_COLORS", slotId, ...colors, viewportFit: "cover" }, "*");
          parent.postMessage({ type: "MDV_BROWSER_SCROLL", slotId, scrollTop: collapsed ? 800 : 0, deltaTop: collapsed ? 40 : -40 }, "*");
        }, { colors, collapsed });
        await expect(top).toHaveCSS("background-color", colors.topColor);
        await expect(bottom).toHaveCSS("background-color", colors.bottomColor);
        await expect(iframe).toHaveCSS("background-color", colors.topColor);
        await expect(address).toHaveCSS("color", collapsed ? "rgb(243, 244, 246)" : "rgb(38, 49, 66)");
        await expect(slot.locator("[data-safari-style]")).toHaveAttribute("data-browser-collapsed", String(collapsed));
        // A scrolling accent can tint the browser but must not paint a stripe
        // over the page. Only opaque pinned page edges may get seam guards.
        await expect(slot.locator("[data-preview-edge]")).toHaveCount(0);
        const bounds = await slot.evaluate(el => {
          const content = el.querySelector("iframe")!.getBoundingClientRect();
          const header = el.querySelector("[data-ios-top-surface]")!.getBoundingClientRect();
          const footer = el.querySelector("[data-ios-bottom-surface]")!.getBoundingClientRect();
          return { topGap: content.top - header.bottom, bottomGap: footer.top - content.bottom };
        });
        expect(Math.abs(bounds.topGap)).toBeLessThan(1);
        expect(Math.abs(bounds.bottomGap)).toBeLessThan(1);
        if (!rotation) {
          const clock = slot.locator("[data-status-clock]");
          if (collapsed) await expect(clock).not.toHaveCSS("color", "rgb(255, 255, 255)");
          else await expect(clock).toHaveCSS("color", "rgb(255, 255, 255)");
        }
        const theme = page.getByRole("button", { name: /^(Dark|Light) theme$/ });
        await theme.click();
        await expect(top).toHaveCSS("background-color", colors.topColor);
        await expect(bottom).toHaveCSS("background-color", colors.bottomColor);
      }
    }
  });
}

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

test("resizes Duo side controls with the address bar without moving their anchors or covering the page", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  for (const posture of ["folded", "unfolded"]) {
    await page.getByTestId("device-switcher-button").first().click();
    await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("iPhone Duo");
    await page.locator(`button[title="Apple iPhone Duo (${posture})"]`).click();
    for (let rotation = 0; rotation < 2; rotation++) {
      if (rotation) {
        await openViewportActions(page);
        await slot.getByRole("button", { name: "Rotate", exact: true }).click();
      }
      const iframe = slot.locator("iframe");
      const expanded = slot.locator('[data-browser-control="bottom-address"]');
      const compact = slot.locator('[data-browser-control="compact-address"]');
      await expect(expanded).toBeVisible();
      await expect(slot.locator('[data-browser-control="bottom-toolbar"]')).toHaveCount(0);
      // Glass is local to floating controls, never a full screen-edge panel.
      await expect(slot.locator('[data-duo-background-extension], [data-duo-glass]')).toHaveCount(0);
      await expect(slot.locator('[data-duo-control-group="status"]')).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const sideToolbar = slot.locator('[data-browser-control="side-toolbar"]');
      if (await sideToolbar.count()) {
        await expect(sideToolbar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(sideToolbar.locator('[data-duo-glass-group="back"]')).toHaveCSS("border-radius", "50%");
        await expect(sideToolbar.locator('[data-duo-glass-group="bookmarks"]')).toHaveCSS("border-radius", "50%");
        await expect(sideToolbar.locator('[data-duo-glass-group="tabs"] [data-browser-control]')).toHaveCount(2);
        const contentBox = (await iframe.boundingBox())!;
        const screenBox = (await slot.locator('[data-device-screen]').boundingBox())!;
        expect(contentBox.x + contentBox.width).toBeLessThan(screenBox.x + screenBox.width - 20);
        const controlsBox = (await sideToolbar.boundingBox())!;
        expect(controlsBox.x).toBeGreaterThanOrEqual(contentBox.x + contentBox.width);
        const upper = (await sideToolbar.locator('[data-duo-glass-group="bookmarks"]').boundingBox())!;
        const lower = (await sideToolbar.locator('[data-duo-glass-group="tabs"]').boundingBox())!;
        expect(lower.y).toBeGreaterThan(upper.y + upper.height + 10);
      }
      const addressGlass = slot.locator('[data-duo-glass-group="address"]');
      await expect(addressGlass).toHaveCSS("border-radius", "999px");
      const addressBounds = (await addressGlass.boundingBox())!;
      const expandedBounds = (await expanded.boundingBox())!;
      expect(addressBounds.width).toBeLessThan(expandedBounds.width * .9);
      expect(addressBounds.x).toBeGreaterThan(expandedBounds.x);
      const originalSize = await iframe.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight }));
      const sideControls = slot.locator('[data-browser-control="side-toolbar"], [data-browser-control="duo-status"]');
      const readSidePositions = () => sideControls.evaluateAll(elements => elements.map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }));
      const originalPositions = await readSidePositions();
      const embedded = await (await iframe.elementHandle())!.contentFrame();
      const sendScroll = (scrollTop: number, deltaTop: number) => embedded!.evaluate(({ scrollTop, deltaTop }) => {
        parent.postMessage({ type: "MDV_BROWSER_SCROLL", slotId: window.name.replace(/^mdv-(?:mobile-)?preview-/, ""), scrollTop, deltaTop }, "*");
      }, { scrollTop, deltaTop });
      const expectSideSize = async (small: boolean) => {
        if (!(await sideToolbar.count())) return;
        await expect(sideToolbar).toHaveAttribute("data-controls-size", small ? "compact" : "expanded");
        for (const group of ["back", "bookmarks", "tabs"]) {
          const control = sideToolbar.locator(`[data-duo-glass-group="${group}"]`);
          await expect(control).toHaveCSS("transform", small ? "matrix(0.7, 0, 0, 0.7, 0, 0)" : "matrix(1, 0, 0, 1, 0, 0)");
          await expect(control).toHaveCSS("opacity", "1");
        }
        await expect(slot.locator('[data-browser-control="duo-status"]')).toBeVisible();
      };
      await sendScroll(800, 40);
      await expectSideSize(true);
      await expect(compact).toBeVisible();
      await expect(expanded).toHaveCount(0);
      await expect(slot.locator('[data-duo-glass="right"]')).toHaveCount(0);
      const compactSize = await iframe.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight }));
      expect(compactSize.width).toBe(originalSize.width);
      expect(compactSize.height).toBeGreaterThan(originalSize.height);
      expect(await readSidePositions()).toEqual(originalPositions);
      const pageBox = (await iframe.boundingBox())!;
      const barBox = (await compact.boundingBox())!;
      expect(barBox.y).toBeGreaterThanOrEqual(pageBox.y + pageBox.height - 1);
      await sendScroll(800, 0);
      // Stopping longer than the former idle timer and tiny direction changes
      // must keep the side actions in the same compact state as the address.
      await page.waitForTimeout(450);
      await sendScroll(801, 1);
      await sendScroll(800, -1);
      await expect(compact).toBeVisible();
      await expectSideSize(true);
      // Rapid reversals interrupt the visual transition, not the shared state.
      await sendScroll(760, -40);
      await sendScroll(840, 40);
      await expectSideSize(true);
      await sendScroll(760, -40);
      await expectSideSize(false);
      await expect(expanded).toBeVisible();
      await expect(compact).toHaveCount(0);
      await expect(slot.locator('[data-browser-control="bottom-toolbar"]')).toHaveCount(0);
      expect(await iframe.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight }))).toEqual(originalSize);
      expect(await readSidePositions()).toEqual(originalPositions);
      if (await sideToolbar.count()) {
        let previousTint = "";
        for (const dark of [true, false]) {
          const bottomColor = dark ? "rgb(24, 35, 65)" : "rgb(226, 238, 220)";
          await embedded!.evaluate(({ bottomColor, dark }) => {
            parent.postMessage({ type: "MDV_PAGE_SURFACE_COLORS", slotId: window.name.replace(/^mdv-(?:mobile-)?preview-/, ""),
              topColor: dark ? "rgb(245, 245, 245)" : "rgb(20, 20, 20)", topIsDark: !dark,
              bottomColor, bottomIsDark: dark }, "*");
          }, { bottomColor, dark });
          await expect(slot.locator('[data-ios-bottom-surface]')).toHaveCSS("background-color", bottomColor);
          const tint = await addressGlass.evaluate(el => getComputedStyle(el).backgroundColor);
          expect(tint).not.toBe(previousTint);
          previousTint = tint;
          for (const group of ["back", "bookmarks", "tabs"]) {
            await expect(sideToolbar.locator(`[data-duo-glass-group="${group}"]`)).toHaveCSS("background-color", tint);
            await expect(sideToolbar.locator(`[data-duo-glass-group="${group}"]`)).toHaveCSS("color", dark ? "rgb(243, 244, 246)" : "rgb(38, 49, 66)");
          }
        }
      }
    }
  }
});

test("continues Duo page sections into the right gutter and adapts control contrast", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  for (const posture of ["folded", "unfolded"]) {
    await page.getByTestId("device-switcher-button").first().click();
    await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("iPhone Duo");
    await page.locator(`button[title="Apple iPhone Duo (${posture})"]`).click();
    for (let rotation = 0; rotation < 2; rotation++) {
      if (rotation) {
        await openViewportActions(page);
        await slot.getByRole("button", { name: "Rotate", exact: true }).click();
      }
      if (!(await slot.locator('[data-browser-control="side-toolbar"]').count())) continue;
      const iframe = slot.locator("iframe");
      const embedded = await (await iframe.elementHandle())!.contentFrame();
      await embedded!.goto(new URL("/scripts/header-seam-audit/duo-surfaces.html", page.url()).href);
      const surface = slot.locator("[data-duo-side-surface]");
      await expect(surface).toHaveCSS("background-image", /rgb\(241, 245, 249\)/);
      const readLightBoundary = () => surface.evaluate(el => {
        const match = (el as HTMLElement).style.backgroundImage.match(/rgb\(241, 245, 249\) ([\d.]+)%/);
        return match ? Number(match[1]) / 100 * el.clientHeight : -1;
      });
      await expect.poll(async () => Math.abs(await readLightBoundary() - 300)).toBeLessThan(1);
      const back = slot.locator('[data-duo-glass-group="back"]');
      const tabs = slot.locator('[data-duo-glass-group="tabs"]');
      await expect(back).toHaveCSS("color", "rgb(243, 244, 246)");
      await expect(tabs).toHaveCSS("color", "rgb(38, 49, 66)");
      await embedded!.evaluate(() => window.scrollTo(0, 260));
      // The pinned header stays dark; the light section starts just below it.
      await expect.poll(async () => Math.abs(await readLightBoundary() - 76)).toBeLessThan(1);
      await expect(back).toHaveCSS("color", "rgb(38, 49, 66)");
      await expect(tabs).toHaveCSS("color", "rgb(38, 49, 66)");
      const bodyWidth = await iframe.evaluate(el => el.clientWidth);
      await embedded!.evaluate(() => window.scrollTo(0, 220));
      await expect(slot.locator('[data-browser-control="bottom-address"]')).toBeVisible();
      expect(await iframe.evaluate(el => el.clientWidth)).toBe(bodyWidth);
    }
  }
});

test("does not report standalone previews as blocked when no extension bridge is present", async ({ page }) => {
  await expect(page.locator("iframe").first()).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.getByText("This site blocks iframe preview.")).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeVisible();
  await page.addInitScript(() => {
    const registered = window as Window & { previewMessages?: string[] };
    registered.previewMessages = [];
    window.addEventListener("message", event => {
      if (event.source === window.parent && typeof event.data?.type === "string") registered.previewMessages!.push(event.data.type);
    });
  });
  await page.getByRole("button", { name: "Scroll sync", exact: true }).click();
  const slot = page.locator("[data-preview-slot-id]").first();
  const original = await (await slot.locator("iframe").elementHandle())!.contentFrame();
  await original!.evaluate(() => window.parent.postMessage({
    type: "MDV_PREVIEW_BLOCKED_OR_UNAVAILABLE", slotId: window.name.replace(/^mdv-(?:mobile-)?preview-/, ""),
  }, "*"));
  await expect(slot.getByText("This site blocks iframe preview.")).toBeVisible();
  await openViewportActions(page);
  await slot.getByRole("button", { name: "Reload preview", exact: true }).first().click();
  await expect(slot.locator("iframe")).toBeVisible();
  const reloaded = await (await slot.locator("iframe").elementHandle())!.contentFrame();
  await expect.poll(() => reloaded!.evaluate(() => (window as Window & { previewMessages?: string[] }).previewMessages ?? [])).toContain("MDV_SCROLL_SYNC_ENABLE");
});

test("uses view-only mode as a clean canvas without reloading previews", async ({ page }) => {
  const deviceCount = await page.locator("[data-preview-slot-id]").count();
  await expect(page.locator("[data-main-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(deviceCount);

  const originalFrame = await (await page.locator("iframe").first().elementHandle())!.contentFrame();
  const token = await originalFrame!.evaluate(() => {
    (window as Window & { continuity?: string }).continuity = "view-only-draft";
    return (window as Window & { continuity?: string }).continuity;
  });
  await page.getByRole("button", { name: "View only", exact: true }).click();

  await expect(page.locator("[data-main-toolbar]")).toHaveCount(0);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show workspace controls" })).toBeVisible();
  await expect(page.getByRole("separator", { name: "Resize adjacent viewports" })).toHaveCount(0);

  await page.getByRole("button", { name: "Show workspace controls" }).click();
  await expect.poll(() => originalFrame!.evaluate(() => (window as Window & { continuity?: string }).continuity)).toBe(token);
  await expect(page.locator("[data-main-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(deviceCount);
});

test("builds an actionable AI fix prompt with optional context", async ({ page }) => {
  await openTools(page);
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

  await openTools(page);
  await page.getByRole("button", { name: "Screen record" }).click();
  await expect(page.getByRole("status")).toContainText("Screen recording in progress · 00:00");
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
});

test("reruns a saved flow without refreshing the previews", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("mdvRecordedFlow", JSON.stringify([
      { id: "step-1", kind: "input", selector: "#email", value: "person@example.com", url: "https://example.com" },
      { id: "step-2", kind: "click", selector: "#continue", url: "https://example.com" },
    ]));
  });
  await page.reload();
  const start = page.getByRole("button", { name: "Start developing" });
  if (await start.isVisible().catch(() => false)) await start.click();
  await dismissFirstRunGuide(page);

  const originalPreview = page.locator("iframe").first();
  await originalPreview.evaluate((iframe) => iframe.setAttribute("data-replay-preview", "original"));
  await openTools(page);
  await page.getByRole("button", { name: "Rerun · 2 steps", exact: true }).click();
  await page.waitForTimeout(400);

  await expect(page.locator('iframe[data-replay-preview="original"]')).toHaveCount(1);
});

test("returns a moved preview to the recorded flow start page", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("mdvRecordedFlow", JSON.stringify([
      { id: "step-1", kind: "click", selector: "#start", url: "https://example.org" },
    ]));
  });
  await page.reload();
  const start = page.getByRole("button", { name: "Start developing" });
  if (await start.isVisible().catch(() => false)) await start.click();
  await dismissFirstRunGuide(page);

  const preview = page.locator("iframe").first();
  await expect(preview).toHaveAttribute("src", "https://example.com");
  await openTools(page);
  await page.getByRole("button", { name: "Rerun · 1 steps", exact: true }).click();
  await expect(preview).toHaveAttribute("src", "https://example.org");
});
