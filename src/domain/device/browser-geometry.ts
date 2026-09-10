import type { Device, Size } from "./device.types";
import { getFrameProfile, type ChromeVariant } from "./frame-profiles";

export type SafariLayout = "compact" | "bottom" | "top" | "side" | "tabs" | "compact-tabs";
export interface BrowserPreferences { version?: "catalog" | "ios26"; layout?: SafariLayout }
export interface BrowserGeometry {
  family: "iphone" | "ipad" | "android" | "none";
  variant: ChromeVariant;
  layout: SafariLayout;
  status: number;
  address: number;
  tabStrip: number;
  toolbar: number;
  pillHeight: number;
  pillBottom: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  content: Size;
  collapse: number;
  homeIndicator: boolean;
  duoControls?: "top" | "side";
  duoToolbarSide?: "left" | "right";
  statusInsetRight?: number;
  neutralChrome?: boolean;
  statusCameraWidth?: number;
}

const legacyOnly = new Set(["apple-iphone-5", "apple-iphone-se-2018", "apple-iphone-x", "apple-iphone-xr"]);
export function supportsIos26(device: Device) {
  return device.brand === "Apple" && (device.type === "phone" || device.type === "tablet") && !legacyOnly.has(device.id);
}

/** Chrome-side presentation geometry, not a claim of native Safari engine emulation.
 * Controls and content share these dimensions so fixed page actions cannot be
 * accidentally covered by our own browser UI. Physical Safari baselines live
 * in docs/device-validation.md; profile constants remain reference approximations.
 */
export function getBrowserGeometry(device: Device, screen: Size, preferences: BrowserPreferences = {}, options: {
  collapsed?: number; keyboardHeight?: number; showStatusBar?: boolean; showUrlBar?: boolean; viewportFit?: "auto" | "cover";
} = {}): BrowserGeometry {
  const profile = getFrameProfile(device);
  const landscape = screen.width > screen.height;
  const handheld = device.type === "phone" || device.type === "tablet";
  const ios = profile.platform === "ios" && handheld && device.brand !== "Custom";
  const family = ios ? device.type === "tablet" ? "ipad" : "iphone" : profile.platform === "android" && handheld ? "android" : "none";
  const modern = supportsIos26(device) && preferences.version !== "catalog";
  const variant = modern ? "ios-liquid-glass" : profile.chromeVariant;
  const neutralChrome = ios && device.type === "phone" && profile.osMajor >= 27;
  if (device.id.startsWith("apple-iphone-duo-")) {
    // Apple shows top Safari controls in portrait and side controls in landscape
    // Split View. Applying that adaptation to this single-page preview is an
    // approximation; these are not published native Safari viewport metrics.
    const folded = device.id === "apple-iphone-duo-folded-2026";
    const controls = options.showUrlBar !== false;
    const status = options.showStatusBar === false ? 0 : folded && !landscape ? 80 : 64;
    const collapse = Math.max(0, Math.min(1, options.collapsed ?? 0));
    const address = controls && !landscape ? 64 : 0;
    // Collapsing buttons must not change page width and reflow its header.
    const toolbar = controls && landscape ? 72 : 0;
    // Only the outer display has a visible camera. In landscape its original
    // artwork rotates to the right edge; the inner screen needs no sensor inset.
    // The camera mask extends to ~72 CSS px below the outer screen's top.
    // Keep eight extra pixels so neither the page nor the header touches it.
    const top = landscape ? 0 : Math.max(status, address, folded ? 80 : 0);
    const duoToolbarSide = landscape && !folded ? "right" : "left";
    const statusSide = landscape ? Math.max(status ? 76 : 12, folded ? 80 : 0) : 0;
    const left = duoToolbarSide === "right" ? statusSide : toolbar;
    const right = duoToolbarSide === "right" ? toolbar : statusSide;
    const bottom = Math.max(landscape ? 0 : 12, options.keyboardHeight ?? 0);
    return { family, variant, layout: landscape ? "side" : "top", duoControls: landscape ? "side" : "top",
      duoToolbarSide, statusInsetRight: folded && !landscape ? 80 : 20, neutralChrome,
      status, address, toolbar, tabStrip: 0, pillHeight: 0, pillBottom: 0,
      top, bottom, left, right,
      content: { width: Math.max(1, screen.width - left - right), height: Math.max(1, screen.height - top - bottom) },
      collapse, homeIndicator: true };
  }
  const tablet = family === "ipad";
  const defaultLayout: SafariLayout = tablet ? "tabs" : variant === "ios-liquid-glass" ? "compact" : profile.osMajor < 15 ? "top" : "bottom";
  const requested = preferences.layout ?? defaultLayout;
  const layout: SafariLayout = tablet ? requested === "compact-tabs" ? requested : "tabs"
    : ["compact", "bottom", "top"].includes(requested) && (variant === "ios-liquid-glass" || requested !== "compact") ? requested : defaultLayout;
  const collapse = Math.max(0, Math.min(1, options.collapsed ?? 0));
  const mix = (expanded: number, reduced: number) => expanded + (reduced - expanded) * collapse;
  const homeIndicator = ios && profile.kind !== "iphone-classic";
  const safeBottom = !homeIndicator ? 0 : tablet ? 20 : landscape ? 21 : 34;
  const status = options.showStatusBar === false ? 0 : family === "none" ? 0 : landscape && !tablet ? ios ? 0 : 24 : profile.safeAreaInsetTop;
  let address = 0, tabStrip = 0, toolbar = 0, pillHeight = 0, pillBottom = 0, bottom = safeBottom;
  if (options.showUrlBar !== false) {
    if (family === "ipad") { address = 46; tabStrip = layout === "tabs" ? 28 : 0; }
    else if (family === "iphone") {
      if (layout === "compact") {
        pillHeight = mix(landscape ? 40 : 46, 22);
        pillBottom = mix(Math.max(8, safeBottom - 4), 14);
        bottom = pillBottom + pillHeight + 8;
      } else {
        address = mix(landscape ? 38 : 44, 24);
        toolbar = mix(landscape ? 32 : 40, 0);
        bottom = safeBottom + toolbar + (layout === "bottom" ? address : 0);
      }
    } else if (family === "android") { address = mix(48, 0); bottom = 36; }
  }
  const top = status + tabStrip + (family === "iphone" && layout === "bottom" ? 0 : address);
  // The new Apple previews also keep cover pages clear of the sensor: Chromium
  // does not expose that native Safari safe-area inset to the embedded page.
  // Older profiles retain their existing cover-page presentation.
  const side = family === "iphone" && landscape && (options.viewportFit !== "cover" || neutralChrome) && profile.kind !== "iphone-classic"
    ? Math.max(44, profile.safeAreaInsetTop) : 0;
  const keyboardBottom = options.keyboardHeight ? Math.max(bottom, options.keyboardHeight) : bottom;
  return { family, variant, layout, status, address, tabStrip, toolbar, pillHeight, pillBottom, top,
    bottom: keyboardBottom, left: side, right: side,
    content: { width: Math.max(1, screen.width - side * 2), height: Math.max(1, screen.height - top - keyboardBottom) },
    collapse, homeIndicator, neutralChrome, statusCameraWidth: neutralChrome ? 120 : undefined };
}

/** Quantized transitions avoid reflowing the iframe on every scroll pixel. */
export function nextBrowserCollapse(current: number, scrollTop: number, deltaTop: number): number {
  if (scrollTop < 12 || deltaTop < -18) return 0;
  if (scrollTop > 96 && deltaTop > 3) return 1;
  return current;
}
