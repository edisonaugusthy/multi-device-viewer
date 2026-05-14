import type { Device } from "../device/device.types";
import type { DisplaySettings, PreviewSlot } from "../simulator/simulator.types";
import { getFrameProfile } from "../device/frame-profiles";
import { supportsOrientation, toLandscapeAwareSize } from "../device/device-service";

// ─── Shell constants (must match DeviceFrame.tsx) ────────────────────────────
const PHONE_SHELL = 9;
const PHONE_INNER = 6;
const TABLET_SHELL = 12;
const TABLET_INNER = 10;
const CARD_GAP = 24;        // px gap between devices in the composite
const CARD_PAD = 32;        // vertical padding above/below each device
const DPR = 2;              // render at 2x for crisp output

// ─── Public API ──────────────────────────────────────────────────────────────

/** Request the background to capture the visible tab at current viewport (hides overlay first). */
export async function captureTabScreenshot(): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, (response: { dataUrl?: string; error?: string } | undefined) => {
      if (chrome.runtime.lastError || !response?.dataUrl) resolve(null);
      else resolve(response.dataUrl);
    });
  });
}

/**
 * Capture the visible tab exactly as the user sees it — extension overlay included.
 * Used for the "Screenshot" action so the annotator gets the full simulator view.
 */
export async function captureTabWithOverlay(): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_TAB_WITH_OVERLAY" }, (response: { dataUrl?: string; error?: string } | undefined) => {
      if (chrome.runtime.lastError || !response?.dataUrl) resolve(null);
      else resolve(response.dataUrl);
    });
  });
}

export interface SlotCaptureMeta {
  slot: PreviewSlot;
  device: Device;
  display: DisplaySettings;
}

/**
 * Composite a side-by-side screenshot of all slots.
 * Captures the visible tab once and fits it into every device frame —
 * the same page content, scaled to fill each frame's viewport area.
 */
export async function captureAllSlots(slots: SlotCaptureMeta[]): Promise<string | null> {
  // 1. Compute frame sizes first
  const frames = slots.map(({ slot, device, display }) => {
    const viewportSize = supportsOrientation(device)
      ? toLandscapeAwareSize(device.cssViewport, slot.orientation)
      : device.cssViewport;
    return { slot, device, display, viewportSize, frame: computeFrameSize(device, display, viewportSize) };
  });

  // 2. Capture the visible tab once — same screenshot for all slots
  const pageDataUrl = await captureTabScreenshot();
  const pageImg = pageDataUrl ? await loadImage(pageDataUrl) : null;

  // 3. Canvas dimensions
  const maxFrameH = Math.max(...frames.map((f) => f.frame.height));
  const totalW = frames.reduce((sum, f) => sum + f.frame.width, 0) + CARD_GAP * (frames.length - 1);
  const canvasW = (totalW + CARD_PAD * 2) * DPR;
  const canvasH = (maxFrameH + CARD_PAD * 2) * DPR;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // Background
  ctx.fillStyle = "#f5f5f3";
  ctx.fillRect(0, 0, totalW + CARD_PAD * 2, maxFrameH + CARD_PAD * 2);

  // 4. Draw each device — same page screenshot scaled into every frame
  let x = CARD_PAD;
  for (const { device, display, viewportSize, frame } of frames) {
    const y = CARD_PAD + (maxFrameH - frame.height) / 2;
    drawDeviceFrame(ctx, device, display, viewportSize, frame, x, y, pageImg);
    x += frame.width + CARD_GAP;
  }

  return canvas.toDataURL("image/png");
}

// ─── Frame size computation ───────────────────────────────────────────────────

interface FrameSize {
  width: number;
  height: number;
  // Internal offsets for where the viewport content sits
  viewportX: number;
  viewportY: number;
  viewportW: number;
  viewportH: number;
}

function getStatusHeight(platform: string, kind: string, compact: boolean) {
  if (platform === "android") return 28;
  if (kind === "iphone-classic" || compact) return 28;
  return 44;
}

function getBottomHeight(platform: string, compact: boolean) {
  if (platform === "android") return 36;
  if (compact) return 62;
  return 90;
}

function computeFrameSize(
  device: Device,
  display: DisplaySettings,
  viewportSize: { width: number; height: number }
): FrameSize {
  const profile = getFrameProfile(device);

  if (device.type === "laptop") {
    const LID_TOP = 22;
    const LID_SIDE = 12;
    const LID_BOT = 10;
    const BEZEL = 3;
    const toolbarH = display.showUrlBar ? 36 : 0;
    const lidW = viewportSize.width + LID_SIDE * 2;
    const lidH = viewportSize.height + toolbarH + LID_TOP + LID_BOT;
    const totalW = lidW + 80;
    const totalH = lidH + 8 + 44 + 8; // hinge + base + shadow
    const lidX = (totalW - lidW) / 2;
    return {
      width: totalW, height: totalH,
      viewportX: lidX + LID_SIDE + BEZEL,
      viewportY: LID_TOP + BEZEL + toolbarH,
      viewportW: viewportSize.width,
      viewportH: viewportSize.height,
    };
  }

  if (device.type === "desktop" || device.type === "tv") {
    const toolbarH = device.type === "desktop" && display.showUrlBar ? 36 : 0;
    const BEZEL = 14;
    const screenW = viewportSize.width + 28;
    const totalW = screenW + 28;
    return {
      width: totalW, height: viewportSize.height + toolbarH + 24 + 58,
      viewportX: (totalW - viewportSize.width) / 2,
      viewportY: BEZEL + toolbarH,
      viewportW: viewportSize.width,
      viewportH: viewportSize.height,
    };
  }

  if (profile.kind === "watch") {
    return {
      width: viewportSize.width + 14, height: viewportSize.height + 14,
      viewportX: 7, viewportY: 7,
      viewportW: viewportSize.width, viewportH: viewportSize.height,
    };
  }

  const landscape = viewportSize.width > viewportSize.height;
  const compact = landscape || profile.kind === "iphone-classic" || profile.kind === "tablet";
  const statusH = display.showStatusBar ? getStatusHeight(profile.platform, profile.kind, compact) : 0;
  const addrH = display.showUrlBar && profile.platform === "android" ? 48 : 0;
  const bottomH = display.showUrlBar ? getBottomHeight(profile.platform, compact) : 0;

  const isTablet = profile.kind === "tablet";
  const shellP = isTablet ? TABLET_SHELL : PHONE_SHELL;
  const innerP = isTablet ? TABLET_INNER : PHONE_INNER;
  const chrome = (shellP + innerP) * 2;
  const screenH = viewportSize.height + statusH + addrH + bottomH;

  return {
    width: viewportSize.width + chrome,
    height: screenH + chrome,
    viewportX: shellP + innerP,
    viewportY: shellP + innerP + statusH + addrH,
    viewportW: viewportSize.width,
    viewportH: viewportSize.height,
  };
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawDeviceFrame(
  ctx: CanvasRenderingContext2D,
  device: Device,
  display: DisplaySettings,
  viewportSize: { width: number; height: number },
  frame: FrameSize,
  ox: number,
  oy: number,
  pageImg: HTMLImageElement | null
) {
  const profile = getFrameProfile(device);

  if (device.type === "laptop") {
    drawLaptopFrame(ctx, device, display, viewportSize, frame, ox, oy, pageImg);
    return;
  }

  if (device.type === "desktop" || device.type === "tv") {
    drawDesktopFrame(ctx, device, display, viewportSize, frame, ox, oy, pageImg);
    return;
  }

  if (profile.kind === "watch") {
    drawWatchFrame(ctx, viewportSize, frame, ox, oy, pageImg);
    return;
  }

  const landscape = viewportSize.width > viewportSize.height;
  const compact = landscape || profile.kind === "iphone-classic" || profile.kind === "tablet";
  const statusH = display.showStatusBar ? getStatusHeight(profile.platform, profile.kind, compact) : 0;
  const addrH = display.showUrlBar && profile.platform === "android" ? 48 : 0;
  const bottomH = display.showUrlBar ? getBottomHeight(profile.platform, compact) : 0;

  const isTablet = profile.kind === "tablet";
  const shellP = isTablet ? TABLET_SHELL : PHONE_SHELL;
  const innerP = isTablet ? TABLET_INNER : PHONE_INNER;
  const shellR = isTablet ? 36 : profile.radius;
  const innerR = Math.max(16, shellR - shellP);
  const contentR = Math.max(10, innerR - innerP - 2);
  const screenH = viewportSize.height + statusH + addrH + bottomH;

  // Shell gradient
  const isIos = profile.platform === "ios";
  const shellGrad = ctx.createLinearGradient(ox, oy, ox + frame.width, oy + frame.height);
  if (isTablet && isIos) {
    shellGrad.addColorStop(0, "#d0cdc6");
    shellGrad.addColorStop(0.5, "#111");
    shellGrad.addColorStop(1, "#e8e4d8");
  } else if (isTablet) {
    shellGrad.addColorStop(0, "#3a424e");
    shellGrad.addColorStop(0.5, "#121820");
    shellGrad.addColorStop(1, "#6c7480");
  } else if (isIos) {
    shellGrad.addColorStop(0, "#c8bc9a");
    shellGrad.addColorStop(0.5, "#111");
    shellGrad.addColorStop(1, "#f0e8d0");
  } else {
    shellGrad.addColorStop(0, "#313844");
    shellGrad.addColorStop(0.5, "#10141a");
    shellGrad.addColorStop(1, "#666e7a");
  }

  ctx.fillStyle = shellGrad;
  roundRect(ctx, ox, oy, frame.width, frame.height, shellR);
  ctx.fill();

  // Inner black bezel
  ctx.fillStyle = "#000";
  roundRect(ctx, ox + shellP, oy + shellP, frame.width - shellP * 2, frame.height - shellP * 2, innerR);
  ctx.fill();

  // White screen area
  ctx.fillStyle = "#fff";
  roundRect(ctx, ox + shellP + innerP, oy + shellP + innerP, viewportSize.width, screenH, contentR);
  ctx.fill();

  // Page content clipped to screen
  if (pageImg) {
    ctx.save();
    roundRect(ctx, ox + frame.viewportX, oy + frame.viewportY, frame.viewportW, frame.viewportH, Math.max(2, contentR - 4));
    ctx.clip();
    drawPageInViewport(ctx, pageImg, ox + frame.viewportX, oy + frame.viewportY, frame.viewportW, frame.viewportH);
    ctx.restore();
  }

  // Status bar overlay
  if (display.showStatusBar && statusH > 0) {
    drawStatusBar(ctx, ox + shellP + innerP, oy + shellP + innerP, viewportSize.width, statusH, isIos ? "9:41" : "9:41", contentR);
  }

  // Device name label
  drawDeviceLabel(ctx, device.name, ox + frame.width / 2, oy + frame.height + 18);
}

function drawLaptopFrame(
  ctx: CanvasRenderingContext2D,
  _device: Device,
  display: DisplaySettings,
  viewportSize: { width: number; height: number },
  frame: FrameSize,
  ox: number,
  oy: number,
  pageImg: HTMLImageElement | null
) {
  const LID_TOP = 22;
  const LID_SIDE = 12;
  const LID_BOT = 10;
  const BEZEL = 3;
  const toolbarH = display.showUrlBar ? 36 : 0;
  const lidW = viewportSize.width + LID_SIDE * 2;
  const lidH = viewportSize.height + toolbarH + LID_TOP + LID_BOT;
  const lidX = ox + (frame.width - lidW) / 2;

  // Lid
  const lidGrad = ctx.createLinearGradient(lidX, oy, lidX, oy + lidH);
  lidGrad.addColorStop(0, "#3a3f48");
  lidGrad.addColorStop(1, "#1e2228");
  ctx.fillStyle = lidGrad;
  roundRect(ctx, lidX, oy, lidW, lidH, 18);
  ctx.fill();

  // Camera dot
  ctx.fillStyle = "#555b66";
  ctx.beginPath();
  ctx.arc(lidX + lidW / 2, oy + 9, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Black bezel
  ctx.fillStyle = "#000";
  roundRect(ctx, lidX + LID_SIDE, oy + LID_TOP, viewportSize.width + BEZEL * 2, viewportSize.height + toolbarH + BEZEL * 2, 5);
  ctx.fill();

  // White screen
  ctx.fillStyle = "#fff";
  roundRect(ctx, lidX + LID_SIDE + BEZEL, oy + LID_TOP + BEZEL, viewportSize.width, viewportSize.height + toolbarH, 3);
  ctx.fill();

  // Browser toolbar
  if (display.showUrlBar) {
    drawDesktopBar(ctx, lidX + LID_SIDE + BEZEL, oy + LID_TOP + BEZEL, viewportSize.width, toolbarH);
  }

  // Page content
  if (pageImg) {
    ctx.save();
    roundRect(ctx, frame.viewportX + ox, oy + frame.viewportY, frame.viewportW, frame.viewportH, 2);
    ctx.clip();
    drawPageInViewport(ctx, pageImg, ox + frame.viewportX, oy + frame.viewportY, frame.viewportW, frame.viewportH);
    ctx.restore();
  }

  // Hinge
  const hingeY = oy + lidH;
  const hingeGrad = ctx.createLinearGradient(ox, hingeY, ox, hingeY + 8);
  hingeGrad.addColorStop(0, "#b0b6bf");
  hingeGrad.addColorStop(1, "#8a9099");
  ctx.fillStyle = hingeGrad;
  ctx.fillRect(ox, hingeY, frame.width, 8);

  // Palm rest
  const baseGrad = ctx.createLinearGradient(ox, hingeY + 8, ox, hingeY + 52);
  baseGrad.addColorStop(0, "#c8cdd5");
  baseGrad.addColorStop(1, "#9fa5b0");
  ctx.fillStyle = baseGrad;
  roundRect(ctx, ox, hingeY + 8, frame.width, 44, 24);
  ctx.fill();

  // Trackpad
  ctx.strokeStyle = "rgba(180,185,195,0.5)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(180,185,195,0.3)";
  roundRect(ctx, ox + frame.width / 2 - 70, hingeY + 18, 140, 22, 9);
  ctx.fill();
  ctx.stroke();

  drawDeviceLabel(ctx, _device.name, ox + frame.width / 2, oy + frame.height + 18);
}

function drawDesktopFrame(
  ctx: CanvasRenderingContext2D,
  device: Device,
  display: DisplaySettings,
  viewportSize: { width: number; height: number },
  frame: FrameSize,
  ox: number,
  oy: number,
  pageImg: HTMLImageElement | null
) {
  const isTv = device.type === "tv";
  const toolbarH = !isTv && display.showUrlBar ? 36 : 0;
  const BEZEL = isTv ? 10 : 14;
  const screenW = viewportSize.width + 28;
  const screenH = viewportSize.height + toolbarH + 24;
  const screenX = ox + (frame.width - screenW) / 2;

  const monGrad = ctx.createLinearGradient(screenX, oy, screenX + screenW, oy + screenH);
  if (isTv) {
    monGrad.addColorStop(0, "#101318");
    monGrad.addColorStop(1, "#1e2228");
  } else {
    monGrad.addColorStop(0, "#252b33");
    monGrad.addColorStop(1, "#343b45");
  }
  ctx.fillStyle = monGrad;
  roundRect(ctx, screenX, oy, screenW, screenH, 14);
  ctx.fill();

  // Screen white
  ctx.fillStyle = "#fff";
  roundRect(ctx, screenX + BEZEL, oy + BEZEL, viewportSize.width, viewportSize.height + toolbarH, 6);
  ctx.fill();

  if (!isTv && display.showUrlBar) {
    drawDesktopBar(ctx, screenX + BEZEL, oy + BEZEL, viewportSize.width, toolbarH);
  }

  if (pageImg) {
    ctx.save();
    roundRect(ctx, ox + frame.viewportX, oy + frame.viewportY, frame.viewportW, frame.viewportH, 4);
    ctx.clip();
    drawPageInViewport(ctx, pageImg, ox + frame.viewportX, oy + frame.viewportY, frame.viewportW, frame.viewportH);
    ctx.restore();
  }

  // Stand
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(ox + frame.width / 2 - 5, oy + screenH, 10, 24);
  ctx.fillStyle = "#9ca3af";
  roundRect(ctx, ox + frame.width / 2 - 60, oy + screenH + 24, 120, 6, 4);
  ctx.fill();

  drawDeviceLabel(ctx, device.name, ox + frame.width / 2, oy + frame.height + 18);
}

function drawWatchFrame(
  ctx: CanvasRenderingContext2D,
  viewportSize: { width: number; height: number },
  frame: FrameSize,
  ox: number,
  oy: number,
  pageImg: HTMLImageElement | null
) {
  ctx.fillStyle = "#1c1c1e";
  roundRect(ctx, ox, oy, frame.width, frame.height, 44);
  ctx.fill();

  ctx.fillStyle = "#000";
  roundRect(ctx, ox + 7, oy + 7, viewportSize.width, viewportSize.height, 36);
  ctx.fill();

  if (pageImg) {
    ctx.save();
    roundRect(ctx, ox + 7, oy + 7, viewportSize.width, viewportSize.height, 36);
    ctx.clip();
    drawPageInViewport(ctx, pageImg, ox + 7, oy + 7, viewportSize.width, viewportSize.height);
    ctx.restore();
  }
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

/**
 * Draw the page screenshot into the destination rect (w × h).
 *
 * Scales the full screenshot so its width fits exactly into w (no cropping).
 * The scaled height is drawn from the top; if it's shorter than h the
 * remainder is left as white (already filled by the caller).
 * If the scaled image is taller than h, we show only the top h pixels.
 *
 * This matches the reference: the desktop screenshot is scaled down uniformly
 * to fit the phone/laptop frame width — no cropping, no cover.
 */
function drawPageInViewport(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Scale so source width = dest width
  const scale  = iw / w;                    // src pixels per dest pixel
  const destH  = Math.min(h, ih / scale);   // how many dest rows the full image fills (capped at h)
  const srcH   = destH * scale;             // corresponding src rows

  ctx.drawImage(img, 0, 0, iw, srcH, x, y, w, destH);
}

function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  time: string,
  radius: number
) {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = `700 ${Math.round(h * 0.5)}px -apple-system, system-ui, sans-serif`;
  ctx.fillText(time, x + 14, y + h * 0.72);
}

function drawDesktopBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(x, y + h - 1, w, 1);

  // Traffic lights
  const dots = ["#ff605c", "#ffbd44", "#00ca4e"];
  dots.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 14 + i * 18, y + h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // URL bar
  ctx.fillStyle = "#fff";
  roundRect(ctx, x + 70, y + 6, w - 90, h - 12, 6);
  ctx.fill();
}

function drawDeviceLabel(ctx: CanvasRenderingContext2D, name: string, cx: number, y: number) {
  const label = name
    .replace(/^Apple\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\((?:20\d{2}|6th Gen|40mm)\)/gi, "");
  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, y);
  ctx.textAlign = "left";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// ─── Legacy helpers (kept for single-card captures) ──────────────────────────

export async function downloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.downloads) {
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: true });
    return;
  }
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export function screenshotFilename(label: string): string {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `multi-device-viewer-${safeLabel || "capture"}-${date}.png`;
}

// kept for per-card screenshot (still uses html-to-image for the card DOM)
export { toPng as captureNodeToPng } from "html-to-image";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}
