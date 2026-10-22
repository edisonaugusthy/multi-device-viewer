import type { Device, Orientation, Size } from "./device.types";
import { getMockupViewport } from "./device-service";
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
  /** iPhone Duo: the outer display's side column, or the inner display's iPad-like top bar. */
  duoControls?: "side" | "top";
  duoControlsEdge?: "left" | "right";
  duoStatusTop?: number;
  duoIconCenterRight?: number;
  duoFullWidthBottom?: boolean;
  statusInsetRight?: number;
  neutralChrome?: boolean;
  statusCameraWidth?: number;
  cameraBottomInset?: number;
}

const legacyOnly = new Set(["apple-iphone-5", "apple-iphone-se-2018", "apple-iphone-x", "apple-iphone-xr"]);
export function supportsIos26(device: Device) {
  return device.brand === "Apple" && (device.type === "phone" || device.type === "tablet") && !legacyOnly.has(device.id);
}

/** Chrome-side presentation geometry, not a claim of native Safari engine emulation.
 * Controls reserve page space; Duo side controls float over a page-colored gutter.
 * Profile constants are reference approximations, not native measurements.
 */
export function getBrowserGeometry(device: Device, screen: Size, preferences: BrowserPreferences = {}, options: {
  orientation?: Orientation; collapsed?: number; keyboardHeight?: number; showStatusBar?: boolean; showUrlBar?: boolean; viewportFit?: "auto" | "cover";
} = {}): BrowserGeometry {
  const profile = getFrameProfile(device);
  const landscape = screen.width > screen.height;
  const handheld = device.type === "phone" || device.type === "tablet";
  const ios = profile.platform === "ios" && handheld && device.brand !== "Custom";
  const family = ios ? device.type === "tablet" ? "ipad" : "iphone" : profile.platform === "android" && handheld ? "android" : "none";
  const modern = supportsIos26(device) && preferences.version !== "catalog";
  const variant = modern ? "ios-liquid-glass" : profile.chromeVariant;
  const neutralChrome = ios && device.type === "phone" && profile.osMajor >= 27;
  const frameViewport = getMockupViewport(device.mockupAssets[0], options.orientation ?? (landscape ? "landscape" : "portrait"));
  const camera = frameViewport?.occlusions?.[0];
  const cameraBottomInset = camera && frameViewport && camera.top > frameViewport.height * 0.75
    ? Math.ceil((frameViewport.height - camera.top) * screen.height / frameViewport.height) + 8 : 0;
  if (device.id.startsWith("apple-iphone-duo-")) {
    // Drawn from Apple's and reviewers' screenshots of Safari on iPhone Duo.
    // Dimensions are preview layout constants, not published native metrics.
    const controls = options.showUrlBar !== false;
    const statusShown = options.showStatusBar !== false;
    const collapse = Math.max(0, Math.min(1, options.collapsed ?? 0));
    if (device.id !== "apple-iphone-duo-folded-2026") {
      // The inner display runs Safari like an iPad, in either orientation: one
      // bar across the top with back and bookmarks, the address, new tab and
      // tabs, and the status at its end. The page keeps the whole width and
      // runs under the home indicator; nothing minimizes on scroll.
      const bar = controls || statusShown ? 60 : 0;
      const bottom = options.keyboardHeight ?? 0;
      return { family, variant, layout: "top", duoControls: "top", neutralChrome, statusInsetRight: 0,
        status: statusShown ? bar : 0, address: controls ? 40 : 0, toolbar: 0, tabStrip: 0, pillHeight: 0, pillBottom: 0,
        top: bar, bottom, left: 0, right: 0,
        content: { width: screen.width, height: Math.max(1, screen.height - bar - bottom) },
        collapse, homeIndicator: true };
    }
    // The outer display keeps a column of floating controls beside the camera:
    // status under the camera, then back and bookmarks, with new tab and tabs
    // at the bottom, and the address bar floating at the foot of the page.
    const status = statusShown ? 56 : 0;
    const minimized = collapse > 0.5;
    const address = controls ? minimized ? 24 : 48 : 0;
    const toolbar = controls ? 80 : 0;
    // Keep the page clear of floating controls and the camera.
    const cameraCenterRight = camera && frameViewport
      ? (frameViewport.width - camera.left - camera.width / 2) * screen.width / frameViewport.width
      : landscape ? screen.width * 83 / 1060 : screen.width * 74 / 724;
    const duoControlsEdge = cameraCenterRight > screen.width / 2 ? "left" : "right";
    const cameraCenterOffset = duoControlsEdge === "left" ? screen.width - cameraCenterRight : cameraCenterRight;
    const gutter = Math.ceil(cameraCenterOffset + 24);
    const right = duoControlsEdge === "right" ? gutter : 0;
    const left = duoControlsEdge === "left" ? gutter : 0;
    const bottom = Math.max(12 + address, options.keyboardHeight ?? 0);
    return { family, variant, layout: "side", duoControls: "side",
      duoIconCenterRight: cameraCenterOffset, duoControlsEdge,
      duoFullWidthBottom: !(landscape || cameraBottomInset > 0),
      duoStatusTop: camera && frameViewport && camera.top < frameViewport.height * 0.25
        ? Math.ceil((camera.top + camera.height) * screen.height / frameViewport.height) + 14
        : 24,
      statusInsetRight: 0, neutralChrome,
      status, address, toolbar, tabStrip: 0, pillHeight: 0, pillBottom: 0,
      top: 0, bottom, left, right,
      content: { width: Math.max(1, screen.width - left - right), height: Math.max(1, screen.height - bottom) },
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
  const safeBottom = Math.max(cameraBottomInset, !homeIndicator ? 0 : tablet ? 20 : landscape ? 21 : 34);
  const cameraLeft = camera && frameViewport ? camera.left * screen.width / frameViewport.width : 0;
  const cameraRight = camera && frameViewport ? (camera.left + camera.width) * screen.width / frameViewport.width : 0;
  // In landscape, only a camera on a side edge reserves a column; a wide
  // fold's camera in the top edge stays in the status bar instead.
  const cameraTop = camera && frameViewport ? camera.top * screen.height / frameViewport.height : 0;
  const cameraLeftEdge = family === "android" && landscape && camera && cameraLeft < screen.width / 4 && cameraLeft < cameraTop;
  const cameraRightEdge = family === "android" && landscape && camera && cameraRight > screen.width * 0.75 && screen.width - cameraRight < cameraTop;
  // A camera in the top edge can sit below the profile's approximate safe area.
  // Keep Android address bars below the visible lens.
  const cameraStatusInset = family === "android" && camera && frameViewport && !cameraLeftEdge && !cameraRightEdge
    && camera.top < frameViewport.height / 4 && camera.height < frameViewport.height / 4
    ? Math.ceil((camera.top + camera.height) * screen.height / frameViewport.height) + 5 : 0;
  const status = options.showStatusBar === false ? 0 : family === "none" ? 0 : landscape && !tablet ? ios ? 0 : Math.max(24, cameraStatusInset) : Math.max(profile.safeAreaInsetTop, cameraStatusInset);
  let address = 0, tabStrip = 0, toolbar = 0, pillHeight = 0, pillBottom = 0, bottom = safeBottom;
  if (options.showUrlBar !== false) {
    if (family === "ipad") { address = 46; tabStrip = layout === "tabs" ? 28 : 0; }
    else if (family === "iphone") {
      if (layout === "compact") {
        pillHeight = mix(landscape ? 40 : 46, 22);
        pillBottom = mix(Math.max(8, safeBottom - 4), Math.max(14, cameraBottomInset));
        bottom = pillBottom + pillHeight + 8;
      } else {
        address = mix(landscape ? 38 : 44, 24);
        toolbar = mix(landscape ? 32 : 40, 0);
        bottom = safeBottom + toolbar + (layout === "bottom" ? address : 0);
      }
    } else if (family === "android") { address = mix(48, 0); bottom = 36 + cameraBottomInset; }
  }
  const top = status + tabStrip + (family === "iphone" && layout === "bottom" ? 0 : address);
  // The new Apple previews also keep cover pages clear of the sensor: Chromium
  // does not expose that native Safari safe-area inset to the embedded page.
  // Older profiles retain their existing cover-page presentation.
  const side = family === "iphone" && landscape && (options.viewportFit !== "cover" || neutralChrome) && profile.kind !== "iphone-classic"
    ? Math.max(44, profile.safeAreaInsetTop) : 0;
  const left = cameraLeftEdge ? Math.ceil(cameraRight) + 8 : side;
  const right = cameraRightEdge ? Math.ceil(screen.width - cameraLeft) + 8 : side;
  const keyboardBottom = options.keyboardHeight ? Math.max(bottom, options.keyboardHeight + cameraBottomInset) : bottom;
  return { family, variant, layout, status, address, tabStrip, toolbar, pillHeight, pillBottom, top,
    bottom: keyboardBottom, left, right,
    content: { width: Math.max(1, screen.width - left - right), height: Math.max(1, screen.height - top - keyboardBottom) },
    collapse, homeIndicator, neutralChrome, cameraBottomInset,
    statusCameraWidth: neutralChrome
      ? camera && frameViewport && !landscape ? Math.ceil(camera.width * screen.width / frameViewport.width) + 16 : 120
      : undefined };
}

/** Quantized transitions avoid reflowing the iframe on every scroll pixel. */
export function nextBrowserCollapse(current: number, scrollTop: number, deltaTop: number): number {
  if (scrollTop < 12 || deltaTop < -18) return 0;
  if (scrollTop > 96 && deltaTop > 3) return 1;
  return current;
}
