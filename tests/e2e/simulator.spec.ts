import { expect, test, type Page } from "@playwright/test";

async function expectScreenSize(screen: ReturnType<Page["locator"]>, width: number, height: number) {
  // Downloaded raster openings can differ fractionally from the logical viewport.
  await expect.poll(() => screen.evaluate((el, target) => Math.abs(parseFloat(getComputedStyle(el).width) - target), width)).toBeLessThan(2);
  await expect.poll(() => screen.evaluate((el, target) => Math.abs(parseFloat(getComputedStyle(el).height) - target), height)).toBeLessThan(2);
}

async function dismissFirstRunGuide(page: Page) {
  const skipTour = page.getByRole("button", { name: "Skip feature tour" });
  if (await skipTour.isVisible().catch(() => false)) await skipTour.click();
}

// Device controls fade in while a device is hovered, so tests hover its caption first.
async function revealControls(page: Page, index = 0) {
  await page.locator("[data-preview-slot-id]").nth(index).locator("[data-device-caption]").hover();
}

async function openViewportActions(page: Page, index = 0) {
  await revealControls(page, index);
  const toggle = page.locator("[data-preview-slot-id]").nth(index).getByRole("button", { name: "Viewport options", exact: true });
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
}

async function switchDevice(page: Page, query: string, selector: string, index = 0) {
  await revealControls(page, index);
  await page.locator("[data-preview-slot-id]").nth(index).getByTestId("device-switcher-button").click();
  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill(query);
  await page.locator(selector).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("device-switcher-panel")).toHaveCount(0);
}

async function toggleTheme(page: Page) {
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Settings" });
  const light = settings.getByRole("button", { name: "Light", exact: true });
  const pressed = await light.getAttribute("aria-pressed") === "true";
  await settings.getByRole("button", { name: pressed ? "Dark" : "Light", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(settings).toHaveCount(0);
}

async function openRecordMenu(page: Page) {
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Record", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  const start = page.getByRole("button", { name: "Start developing" });
  await start.waitFor({ state: "visible", timeout: 1200 }).catch(() => undefined);
  if (await start.isVisible().catch(() => false)) await start.click();
  await dismissFirstRunGuide(page);
});

test("toggles only portrait and landscape with local hardware and saved rotation", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  const hardware = slot.locator('[data-device-frame="apple-iphone-18-pro-2026"] img');
  const screen = slot.locator('[data-device-screen="apple-iphone-18-pro-2026"]');
  const originalSrc = await hardware.getAttribute("src");
  expect(new URL(originalSrc!, page.url()).origin).toBe(new URL(page.url()).origin);
  expect(originalSrc).toContain("/mockups/apple-iphone-18-pro-2026.webp");
  for (let turn = 1; turn <= 4; turn++) {
    await revealControls(page);
    await slot.getByRole("button", { name: "Rotate", exact: true }).click();
    await expectScreenSize(screen, turn % 2 ? 874 : 402, turn % 2 ? 402 : 874);
    await expect.poll(() => hardware.evaluate(el => el.parentElement!.style.transform)).toContain(`rotate(${turn % 2 * 90}deg)`);
    await expect(hardware).toHaveAttribute("src", originalSrc!);
    await expect(slot.locator("iframe")).toHaveCSS("transform", "none");
    if (turn === 1) {
      await page.reload();
      await expect.poll(() => hardware.evaluate(el => el.parentElement!.style.transform)).toContain("rotate(90deg)");
      await expectScreenSize(screen, 874, 402);
    }
  }
});

test("resets orientation when switching between phones and wide unfolded devices", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  await revealControls(page);
  await slot.getByRole("button", { name: "Rotate", exact: true }).click();
  const cases = [
    ["Apple iPhone Duo (folded)", "apple-iphone-duo-folded-2026", 466, 678, true],
    ["Apple iPhone Duo (unfolded)", "apple-iphone-duo-unfolded-2026", 890, 626, true],
    ["Samsung Galaxy Z Fold8 (unfolded)", "samsung-galaxy-z-fold8-unfolded-2026", 979, 739, false],
    ["Google Pixel 10 Pro Fold", "google-pixel-10-pro-fold-2026", 412, 901, true],
    ["Apple iPhone 18 Pro", "apple-iphone-18-pro-2026", 402, 874, true],
  ] as const;
  for (const [name, id, width, height, rotatable] of cases) {
    await switchDevice(page, name, `button[title="${name}"]`);
    const screen = slot.locator(`[data-device-screen="${id}"]`);
    await expect(slot.getByText(`${width}×${height}`, { exact: true })).toBeVisible();
    await expect.poll(() => screen.evaluate(el => parseFloat(getComputedStyle(el).width) > parseFloat(getComputedStyle(el).height))).toBe(width > height);
    await revealControls(page);
    if (!rotatable) {
      await expect(slot.getByRole("button", { name: "Rotate", exact: true })).toHaveCount(0);
      continue;
    }
    await slot.getByRole("button", { name: "Rotate", exact: true }).click();
    await expect(slot.getByText(`${height}×${width}`, { exact: true })).toBeVisible();
    await expect.poll(() => screen.evaluate(el => parseFloat(getComputedStyle(el).width) > parseFloat(getComputedStyle(el).height))).toBe(height > width);
  }
  await page.reload();
  await expectScreenSize(slot.locator('[data-device-screen="apple-iphone-18-pro-2026"]'), 874, 402);
});

test("migrates saved four-direction rotations to portrait and landscape", async ({ page }) => {
  await expect(page.locator("[data-preview-slot-id]")).toHaveCount(3);
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("mdvSimulatorSession")))).toBe(true);
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("mdvSimulatorSession")!);
    session.slots[0].orientation = "portrait-inverted";
    session.slots[1].deviceId = "apple-iphone-duo-unfolded-2026";
    session.slots[1].orientation = "landscape-inverted";
    localStorage.setItem("mdvSimulatorSession", JSON.stringify(session));
  });
  await page.reload();
  await expectScreenSize(page.locator('[data-device-screen="apple-iphone-18-pro-2026"]'), 402, 874);
  await expectScreenSize(page.locator('[data-device-screen="apple-iphone-duo-unfolded-2026"]'), 890, 626);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("mdvSimulatorSession")!).slots.slice(0, 2).map((slot: { orientation: string }) => slot.orientation))).toEqual(["portrait", "landscape"]);
});

test("passes night mode to the preview without applying a color filter", async ({ page }) => {
  const layout = page.locator("[data-interface-layout]");
  if (!(await layout.getAttribute("class"))?.split(" ").includes("dark")) await toggleTheme(page);
  await expect(layout).toHaveClass(/\bdark\b/);
  const frame = page.locator("iframe").first();
  await expect(frame).toHaveCSS("color-scheme", "dark");
  await expect(frame).toHaveCSS("filter", "none");
});

test("shows the simplified navigation controls", async ({ page }) => {
  const toolbar = page.locator("[data-main-toolbar]");
  await expect(toolbar.getByRole("checkbox", { name: "Scroll", exact: true })).toBeVisible();
  await expect(toolbar.getByRole("checkbox", { name: "Navigation", exact: true })).toBeVisible();
  await toolbar.getByRole("checkbox", { name: "Navigation", exact: true }).check();
  await expect(toolbar.getByRole("checkbox", { name: "Navigation", exact: true })).toBeChecked();
  await expect(page.getByLabel("Page direction")).toHaveCount(0);
  await expect(page.getByLabel("Page color scheme")).toHaveCount(0);
  await expect(page.getByText("Responsive review", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Projects and pages", { exact: true })).toHaveCount(0);
});

test("opens the latest devices from startup and quick presets", async ({ page }) => {
  const slots = page.locator("[data-preview-slot-id]");
  await expect(slots).toHaveCount(3);
  await expect(slots.nth(0).locator('[data-device-frame="apple-iphone-18-pro-2026"]')).toBeVisible();
  await expect(slots.nth(1).locator('[data-device-frame="apple-iphone-duo-folded-2026"]')).toBeVisible();
  await expect(slots.nth(2).locator('[data-device-frame="apple-macbook-pro-14-m5-2025"]')).toBeVisible();
  const phoneScreen = slots.nth(0).locator('[data-device-screen="apple-iphone-18-pro-2026"]');
  await expectScreenSize(phoneScreen, 402, 874);
  const duoScreen = slots.nth(1).locator('[data-device-screen="apple-iphone-duo-folded-2026"]');
  await expectScreenSize(duoScreen, 466, 678);

  // A user's saved rotation must survive reopening the simulator.
  await revealControls(page, 1);
  await slots.nth(1).getByRole("button", { name: "Rotate", exact: true }).click();
  await expectScreenSize(duoScreen, 678, 466);
  await page.reload();
  await expectScreenSize(duoScreen, 678, 466);

  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Add device", exact: true }).click();
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

test("selects Duo unfolded in landscape from a portrait phone and allows manual rotation", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  const duoScreen = slot.locator('[data-device-screen="apple-iphone-duo-unfolded-2026"]');
  await switchDevice(page, "iPhone Duo", 'button[title="Apple iPhone Duo (unfolded)"]');
  await expectScreenSize(duoScreen, 890, 626);
  await revealControls(page);
  await slot.getByRole("button", { name: "Rotate", exact: true }).click();
  await expectScreenSize(duoScreen, 626, 890);
});

test("opens toolbar and device screenshots without duplicate Tools actions", async ({ page }) => {
  const viewports = page.locator("[data-preview-slot-id]");
  const viewportCount = await viewports.count();
  expect(viewportCount).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Focus this viewport" })).toHaveCount(0);

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
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Screenshot and annotate" }).click();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
});

test("cuts a device screenshot out of the workspace background", async ({ page }) => {
  await page.evaluate(() => {
    // Paint what the tab would show: the workspace, the backdrop currently
    // behind the device, and an opaque device inset from its box.
    const capture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#e9ecef";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const target = document.querySelector<HTMLElement>("[data-capture-matte]");
      if (target) {
        const box = target.getBoundingClientRect();
        context.fillStyle = target.dataset.captureMatte === "black" ? "#000" : "#fff";
        context.fillRect(box.left - 4, box.top - 4, box.width + 8, box.height + 8);
        context.fillStyle = "#0f766e";
        context.fillRect(box.left + box.width * 0.2, box.top + box.height * 0.2, box.width * 0.6, box.height * 0.6);
      }
      return canvas.toDataURL("image/png");
    };
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: {
        runtime: {
          lastError: undefined,
          sendMessage: (_message: unknown, callback: (response: { dataUrl: string }) => void) => callback({ dataUrl: capture() }),
        },
      },
    });
  });

  await openViewportActions(page);
  await page.locator("[data-preview-slot-id]").first().getByRole("button", { name: "Screenshot and annotate" }).click();
  const editorCanvas = page.locator("canvas");
  await expect(editorCanvas).toBeVisible();
  const alpha = await editorCanvas.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    const at = (x: number, y: number) => pixels[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3];
    return { corner: at(2, 2), center: at(canvas.width / 2, canvas.height / 2) };
  });
  expect(alpha).toEqual({ corner: 0, center: 255 });
  await expect(page.locator("[data-capture-matte]")).toHaveCount(0);
});

test("retries a device screenshot when the tab capture returns a stale frame", async ({ page }) => {
  await page.evaluate(() => {
    let calls = 0;
    // The first frame predates the backdrop and still shows an open menu over
    // the device; later frames are current.
    const capture = () => {
      calls += 1;
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#e9ecef";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const target = document.querySelector<HTMLElement>("[data-capture-matte]");
      if (target) {
        const box = target.getBoundingClientRect();
        if (calls > 1) {
          context.fillStyle = target.dataset.captureMatte === "black" ? "#000" : "#fff";
          context.fillRect(box.left - 4, box.top - 4, box.width + 8, box.height + 8);
        }
        context.fillStyle = "#0f766e";
        context.fillRect(box.left + box.width * 0.2, box.top + box.height * 0.2, box.width * 0.6, box.height * 0.6);
        if (calls === 1) {
          context.fillStyle = "#fff";
          context.fillRect(box.left + box.width * 0.4, box.top + box.height * 0.25, box.width * 0.35, box.height * 0.1);
        }
      }
      return canvas.toDataURL("image/png");
    };
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: {
        runtime: {
          lastError: undefined,
          sendMessage: (_message: unknown, callback: (response: { dataUrl: string }) => void) => callback({ dataUrl: capture() }),
        },
      },
    });
  });

  await openViewportActions(page);
  await page.locator("[data-preview-slot-id]").first().getByRole("button", { name: "Screenshot and annotate" }).click();
  const editorCanvas = page.locator("canvas");
  await expect(editorCanvas).toBeVisible();
  const pixels = await editorCanvas.evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    const at = (x: number, y: number) => [...data.slice((Math.floor(y) * canvas.width + Math.floor(x)) * 4, (Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 4)];
    return { corner: at(2, 2)[3], menuArea: at(canvas.width * 0.55, canvas.height * 0.3) };
  });
  expect(pixels.corner).toBe(0);
  expect(pixels.menuArea).toEqual([15, 118, 110, 255]);
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
  await revealControls(page);
  await page.getByTestId("device-switcher-button").first().click();

  const selection = page.locator('button[title="Apple iPhone 17"]');
  await expect(selection).toBeVisible();
  await expect(selection.locator("button, [role=button]")).toHaveCount(0);
  await expect(selection.locator("xpath=..").getByRole("button", { name: /favorites/ })).toHaveCount(1);

  await selection.locator("xpath=..").getByRole("button", { name: /favorites/ }).click();
  // Starring keeps keyboard focus on the star that was pressed.
  await expect(page.locator("[data-device-favorite]:focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("device-switcher-panel")).toHaveCount(0);
  await expect(page.getByTestId("device-switcher-button").first()).toBeFocused();
  await page.getByTestId("device-switcher-button").first().click();

  await page.getByRole("textbox", { name: "Search name, OS, type, or size" }).fill("Fold7 unfolded");
  await expect(page.locator('button[title="Samsung Galaxy Z Fold7 (unfolded)"]')).toBeVisible();
});

test("discovers expanded current and rugged device families", async ({ page }) => {
  await revealControls(page);
  await page.getByTestId("device-switcher-button").first().click();
  const search = page.getByRole("textbox", { name: "Search name, OS, type, or size" });
  const chooseType = async (name: string) => {
    await page.getByRole("button", { name: /^Device type:/ }).click();
    await page.getByRole("option", { name, exact: true }).click();
  };

  await chooseType("Android");
  await search.fill("XCover7 Pro");
  await expect(page.locator('button[title="Samsung Galaxy XCover7 Pro"]')).toBeVisible();

  await search.fill("");
  await chooseType("Tablets");
  await search.fill("iPad Pro 13 M4");
  await expect(page.locator('button[title="Apple iPad Pro 13-inch (M4)"]')).toBeVisible();

  await search.fill("");
  await chooseType("Laptops");
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
    await switchDevice(page, query, `button[title="${name}"]`);

    const frame = slot.locator(`[data-device-frame="${id}"]`);
    const screen = slot.locator(`[data-device-screen="${id}"]`);
    await expect(frame, `${name} frame`).toBeVisible();
    await expect(screen, `${name} screen`).toBeVisible();
    await expect(slot).toContainText(`${width}×${height}`);

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
  await switchDevice(page, "Galaxy Z Flip7", 'button[title="Samsung Galaxy Z Flip7"]');

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
  await revealControls(page);
  await page.getByRole("button", { name: "Rotate" }).first().click();
  await expect(slot).toContainText("840×360");
  await expect(screen).toHaveCSS("clip-path", /path\(/);
  await expectScreenInsideFrame();
});

test("keeps the Pixel 10a display and Android status row balanced inside its frame", async ({ page }) => {
  await switchDevice(page, "Pixel 10a", 'button[title="Google Pixel 10a"]');

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
  await switchDevice(page, "iPhone 17e", 'button[title="Apple iPhone 17e"]');

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
    await switchDevice(page, model, `button[title="Apple ${model}"]`);
    const slot = page.locator("[data-preview-slot-id]").first();
    const iframe = slot.locator("iframe");
    const top = slot.locator("[data-ios-top-surface]");
    const bottom = slot.locator("[data-ios-bottom-surface]");
    const address = slot.locator('[data-browser-control="bottom-address"]');

    for (let rotation = 0; rotation < 2; rotation++) {
      if (rotation) {
        await revealControls(page);
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
        await toggleTheme(page);
        await expect(top).toHaveCSS("background-color", colors.topColor);
        await expect(bottom).toHaveCSS("background-color", colors.bottomColor);
      }
    }
  });
}

test("keeps the Modern Laptop display below the webcam and uses Windows browser controls", async ({ page }) => {
  await switchDevice(page, "Modern Laptop 15", 'button[title="Modern Laptop 15 inch"]');

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
  await switchDevice(page, "Fold7", 'button[title="Samsung Galaxy Z Fold7 (unfolded)"]');

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
    await switchDevice(page, "iPhone Duo", `button[title="Apple iPhone Duo (${posture})"]`);
    for (let rotation = 0; rotation < 2; rotation++) {
      if (rotation) {
        await revealControls(page);
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
    await switchDevice(page, "iPhone Duo", `button[title="Apple iPhone Duo (${posture})"]`);
    for (let rotation = 0; rotation < 2; rotation++) {
      if (rotation) {
        await revealControls(page);
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
  await page.locator("[data-main-toolbar]").getByRole("checkbox", { name: "Scroll", exact: true }).check();
  const slot = page.locator("[data-preview-slot-id]").first();
  const original = await (await slot.locator("iframe").elementHandle())!.contentFrame();
  await original!.evaluate(() => window.parent.postMessage({
    type: "MDV_PREVIEW_BLOCKED_OR_UNAVAILABLE", slotId: window.name.replace(/^mdv-(?:mobile-)?preview-/, ""),
  }, "*"));
  await expect(slot.getByText("This site blocks iframe preview.")).toBeVisible();
  await revealControls(page);
  await slot.getByRole("button", { name: "Reload preview", exact: true }).first().click();
  await expect(slot.locator("iframe")).toBeVisible();
  const reloaded = await (await slot.locator("iframe").elementHandle())!.contentFrame();
  await expect.poll(() => reloaded!.evaluate(() => (window as Window & { previewMessages?: string[] }).previewMessages ?? [])).toContain("MDV_SCROLL_SYNC_ENABLE");
});

test("uses focus mode as a clean canvas without reloading previews", async ({ page }) => {
  const deviceCount = await page.locator("[data-preview-slot-id]").count();
  await expect(page.locator("[data-main-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(deviceCount);

  const originalFrame = await (await page.locator("iframe").first().elementHandle())!.contentFrame();
  const token = await originalFrame!.evaluate(() => {
    (window as Window & { continuity?: string }).continuity = "view-only-draft";
    return (window as Window & { continuity?: string }).continuity;
  });
  await page.getByRole("button", { name: "Focus mode", exact: true }).click();

  await expect(page.locator("[data-main-toolbar]")).toHaveCount(0);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(0);
  await expect(page.locator("[data-device-caption]")).toHaveCount(0);
  await expect(page.getByRole("separator", { name: "Resize adjacent viewports" })).toHaveCount(0);
  await expect(page.getByRole("toolbar", { name: "Focus mode controls" })).toBeAttached();

  // The focus mode controls appear while the pointer is near the bottom edge.
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width / 2, viewport.height - 30);
  await page.getByRole("button", { name: "One", exact: true }).click();
  await expect(page.locator("[data-preview-slot-id]:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator("[data-preview-slot-id]:visible")).toHaveCount(deviceCount);

  // Hovering any device also shows the controls, so Exit is easy to find.
  const focusControls = page.getByRole("toolbar", { name: "Focus mode controls" });
  await page.mouse.move(viewport.width / 2, 8);
  await expect(focusControls).toHaveCSS("opacity", "0");
  const frame = (await page.locator("[data-preview-slot-id] iframe").first().boundingBox())!;
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 3);
  await expect(focusControls).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-exit-view-only]")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect.poll(() => originalFrame!.evaluate(() => (window as Window & { continuity?: string }).continuity)).toBe(token);
  await expect(page.locator("[data-main-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-device-toolbar]")).toHaveCount(deviceCount);
});

test("builds an actionable AI fix prompt with optional context", async ({ page }) => {
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Fix prompt", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Fix prompt" });
  await expect(dialog.getByRole("heading", { name: "Fix prompt" })).toBeVisible();

  const copy = dialog.getByRole("button", { name: "Copy prompt" });
  await expect(copy).toBeEnabled();
  await dialog.getByLabel("What's wrong?").fill("Navigation overlaps the hero");
  await dialog.getByRole("button", { name: /More details/ }).click();
  await dialog.getByLabel("Reproduction steps").fill("Open the page and use Pixel 10.");
  await dialog.getByRole("button", { name: "Preview", exact: true }).click();

  await expect(copy).toBeEnabled();
  const preview = dialog.getByLabel("Prompt preview");
  await expect(preview).toContainText("Inspect the existing implementation and styling conventions before editing");
  await expect(preview).toContainText("Run the relevant type, unit, and browser checks");
  await expect(preview).toContainText("Navigation overlaps the hero");
  await expect(preview).toContainText("Open the page and use Pixel 10.");
  await expect(dialog).toContainText("Nothing is sent from here");

  const dialogBox = await dialog.boundingBox();
  const previewBox = await preview.boundingBox();
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

  await openRecordMenu(page);
  await page.getByRole("button", { name: "Record this tab" }).click();
  const stop = page.getByRole("dialog", { name: "Record" }).getByRole("button", { name: /^Stop/ });
  await expect(stop).toBeVisible();
  await expect(stop).toContainText("00:0");
  await expect(stop).toHaveAttribute("aria-pressed", "true");
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
  await openRecordMenu(page);
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
  await openRecordMenu(page);
  await page.getByRole("button", { name: "Rerun · 1 steps", exact: true }).click();
  await expect(preview).toHaveAttribute("src", "https://example.org");
});

test("steps through devices of the same type from the device toolbar", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  const caption = slot.locator("[data-device-caption]");
  await revealControls(page);
  const next = slot.getByTestId("next-device-button");
  const nextName = (await next.getAttribute("aria-label"))!.split(": ")[1];
  const start = await caption.textContent();

  await next.click();
  await expect(caption).toContainText(nextName.replace(/^Apple /, ""));
  await slot.getByTestId("previous-device-button").click();
  await expect(caption).toHaveText(start!);
});

test("explains header controls in tooltips without getting in the way", async ({ page }) => {
  const header = page.locator("[data-main-toolbar]");
  const tooltip = page.getByRole("tooltip").filter({ hasText: "Theme, browser bar position" });
  const settings = header.getByRole("button", { name: "Settings", exact: true });

  await settings.hover();
  await expect(tooltip).toBeVisible();
  await expect(settings).toHaveAccessibleDescription("Theme, browser bar position, language, help and the feature tour.");
  await settings.click();
  await expect(tooltip).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
});

test("shows an enlarged All devices preview above the backdrop", async ({ page }) => {
  await page.locator("[data-all-devices-toggle]").click();
  const card = page.locator("[data-gallery-device-id]").nth(1);
  // Enlarging from the hover toolbar leaves the pointer over the card, which
  // must not keep the popup beneath the backdrop.
  await card.locator("[data-device-capture]").hover();
  await card.getByRole("button", { name: "Enlarge preview" }).click();

  const popup = page.locator("[data-gallery-expanded]");
  await expect(popup).toBeVisible();
  const box = (await popup.boundingBox())!;
  const topmost = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return element?.closest("[data-gallery-expanded]") ? "popup" : element?.hasAttribute("data-gallery-backdrop") ? "backdrop" : element?.tagName;
  }, { x: box.x + box.width / 2, y: box.y + 30 });
  expect(topmost).toBe("popup");

  await popup.getByRole("button", { name: "Back to gallery" }).click();
  await expect(popup).toHaveCount(0);
});

test("toggles devices in the Add device picker and explains the four-device limit", async ({ page }) => {
  const devices = page.locator("[data-preview-slot-id]");
  const start = await devices.count();
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Add device", exact: true }).click();
  const panel = page.getByTestId("device-switcher-panel");

  // A device already on screen is deselected by clicking it again.
  await panel.locator("[data-device-pick][data-added]").first().click();
  await expect(devices).toHaveCount(start - 1);
  await expect(panel).toBeVisible();

  while (await devices.count() < 4) {
    await panel.locator("[data-device-pick]:not([data-added]):not(:disabled)").first().click();
  }
  await expect(panel.getByRole("status")).toHaveText("You can compare up to 4 devices. Remove one to add another.");
  await expect(panel.locator("[data-device-pick]:not([data-added])").first()).toBeDisabled();

  // The devices on screen can be saved as a preset straight from the picker.
  await panel.getByRole("button", { name: "Save current" }).click();
  await expect(panel.getByRole("group", { name: "Sets" }).locator('button[aria-pressed="true"]')).toHaveText("Set 1");
});

test("keeps a dragged device in place when stepping devices and resets it when showing one", async ({ page }) => {
  const slot = page.locator("[data-preview-slot-id]").first();
  const device = slot.locator("[data-device-capture]");
  const offset = () => device.evaluate(element => element.style.transform.match(/translate\(([^)]*)\)/)?.[1]);

  await revealControls(page);
  const grip = (await slot.locator("[data-move-handle]").boundingBox())!;
  await page.mouse.move(grip.x + 5, grip.y + 5);
  await page.mouse.down();
  await page.mouse.move(grip.x + 45, grip.y - 55, { steps: 6 });
  await page.mouse.up();
  const dragged = await offset();
  expect(dragged).not.toBe("0px, 0px");

  await revealControls(page);
  await slot.getByTestId("next-device-button").click();
  await expect.poll(offset).toBe(dragged);
  const toolbar = (await slot.locator("[data-device-toolbar]").boundingBox())!;
  expect(toolbar.x).toBeGreaterThanOrEqual(0);
  expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.getByRole("button", { name: "Focus mode", exact: true }).click();
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width / 2, viewport.height - 30);
  await page.getByRole("button", { name: "One", exact: true }).click();
  await expect.poll(() => page.locator("[data-preview-slot-id]:visible [data-device-capture]").evaluate(element => element.style.transform.match(/translate\(([^)]*)\)/)?.[1])).toBe("0px, 0px");
});

test("unchecks the last device in the Add device picker and replaces it with the next pick", async ({ page }) => {
  const devices = page.locator("[data-preview-slot-id]");
  await page.locator("[data-main-toolbar]").getByRole("button", { name: "Add device", exact: true }).click();
  const panel = page.getByTestId("device-switcher-panel");
  while (await devices.count() > 1) {
    const before = await devices.count();
    await panel.locator("[data-device-pick][data-added]").first().click();
    await expect(devices).toHaveCount(before - 1);
  }

  const last = panel.locator("[data-device-pick][data-added]").first();
  const lastName = (await last.getAttribute("title"))!;
  await last.click();
  await expect(panel.getByRole("status")).toHaveText(`Replacing ${lastName}`);
  await expect(devices).toHaveCount(1);

  await panel.locator("[data-device-pick]:not([data-added])").filter({ hasNot: page.locator(`[title="${lastName}"]`) }).nth(1).click();
  await expect(devices).toHaveCount(1);
  await expect(page.locator(`[data-device-frame]`).first()).toBeVisible();
  await expect(panel.getByRole("status")).toHaveCount(0);
  // A device can be listed twice (Recent and its type), so compare unique ids.
  await expect.poll(async () => new Set(await panel.locator("[data-device-pick][data-added]").evaluateAll(rows => rows.map(row => row.getAttribute("data-device-pick")))).size).toBe(1);
  await expect(panel.locator(`[data-device-pick][data-added][title="${lastName}"]`)).toHaveCount(0);
});
