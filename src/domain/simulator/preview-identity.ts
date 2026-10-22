import type { Device } from "../device/device.types";
import { getFrameProfile } from "../device/frame-profiles";

/**
 * How a preview's requests introduce themselves to the website: the browser
 * of the device being shown. A site that chooses its mobile or desktop page
 * on the server reads the User-Agent and client hints, not the frame size.
 */
export interface PreviewIdentity {
  userAgent: string;
  /** Low-entropy client hints; none for Safari and TV browsers, which send none. */
  hints?: { mobile: boolean; platform: string };
}

const FALLBACK_CHROME_MAJOR = 140;
/** Safari's version follows the OS: iOS, iPadOS and macOS 26 ship Safari 26. */
const CURRENT_SAFARI_MAJOR = 26;
const MAX_USER_AGENT = 400;
/** Which device types speak for a tab, most phone-like first. */
const TAB_PRIORITY: readonly Device["type"][] = ["phone", "tablet", "laptop", "desktop", "tv", "custom", "watch"];

/** The major version of the Chrome running the viewer, so a Chrome identity matches its brands. */
export function chromeMajor(userAgent: string): number {
  const match = /Chrome\/(\d+)/.exec(userAgent);
  return match ? Number(match[1]) : FALLBACK_CHROME_MAJOR;
}

// A device's catalog OS version shapes its browser chrome; its Safari is never
// older than today's, so no site takes the preview for an outdated browser.
const osMajor = (device: Device) => Math.max(getFrameProfile(device).osMajor, CURRENT_SAFARI_MAJOR);
const safari = (platform: string, version: number): PreviewIdentity =>
  ({ userAgent: `Mozilla/5.0 (${platform}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 ${platform.startsWith("iPhone") ? "Mobile/15E148 Safari/604.1" : "Safari/605.1.15"}` });
const chromeOn = (platform: string, chrome: number, hint: string, mobile = false): PreviewIdentity => ({
  userAgent: `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome}.0.0.0 ${mobile ? "Mobile " : ""}Safari/537.36`,
  hints: { mobile, platform: hint },
});

/**
 * The browser each device really runs, in the reduced User-Agent form that
 * browser sends today. iPhones get Safari for iOS; iPads and Macs get desktop
 * Safari (an iPad asks for desktop pages); Android phones and tablets, Windows
 * and ChromeOS get the viewer's Chrome on that platform; a Tizen TV gets its
 * own browser. Watches have no browser and kiosks run whichever they were
 * given, so those keep the viewer's own identity.
 */
export function deviceIdentity(device: Device, chrome: number): PreviewIdentity | undefined {
  const { type, os } = device;
  if (type === "phone" || type === "tablet") {
    const ios = getFrameProfile(device).platform === "ios";
    if (ios && type === "phone") return safari(`iPhone; CPU iPhone OS ${osMajor(device)}_0 like Mac OS X`, osMajor(device));
    if (ios) return safari("Macintosh; Intel Mac OS X 10_15_7", osMajor(device));
    return chromeOn("Linux; Android 10; K", chrome, "Android", type === "phone");
  }
  if (type === "laptop" || type === "desktop") {
    if (/macos/i.test(os)) return safari("Macintosh; Intel Mac OS X 10_15_7", osMajor(device));
    if (/windows/i.test(os)) return chromeOn("Windows NT 10.0; Win64; x64", chrome, "Windows");
    if (/chrome\s?os/i.test(os)) return chromeOn("X11; CrOS x86_64 14541.0.0", chrome, "Chrome OS");
    return undefined;
  }
  if (type === "tv" && /tizen/i.test(os)) {
    return { userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Chrome/108.0.5359.1 TV Safari/537.36" };
  }
  return undefined;
}

/**
 * One identity per tab: request rules apply to every preview frame of a site
 * in the tab, so the most phone-like device speaks for all of them. Phones
 * come first, then tablets, laptops, desktops and TVs; among equals, the
 * first in the workspace.
 */
export function previewIdentity(devices: Device[], chrome: number): PreviewIdentity | undefined {
  for (const type of TAB_PRIORITY) {
    for (const device of devices) {
      if (device.type !== type) continue;
      const identity = deviceIdentity(device, chrome);
      if (identity) return identity;
    }
  }
  return undefined;
}

/**
 * The identities of a tab's two kinds of preview frame. "wrapped" frames are
 * navigated by the extension's own page (phone previews in the in-page
 * viewer, and every preview on the simulator page, which is the extension's
 * own); "direct" frames are navigated by the website the viewer is on.
 * Undefined keeps a kind's current identity; null returns it to the browser's own.
 */
export interface PreviewIdentities {
  wrapped?: PreviewIdentity | null;
  direct?: PreviewIdentity | null;
}

/** Phones get their own frame class, so the request rules can give them the phone identity alone. */
export function isWrappedDevice(device: Device): boolean {
  return device.type === "phone";
}

/** With `split`, phones speak for the wrapped frames and the other devices for the direct ones; without it, every frame is wrapped. */
export function previewIdentities(devices: Device[], chrome: number, split: boolean): PreviewIdentities {
  if (!split) return { wrapped: previewIdentity(devices, chrome) ?? null, direct: null };
  return {
    wrapped: previewIdentity(devices.filter(isWrappedDevice), chrome) ?? null,
    direct: previewIdentity(devices.filter(device => !isWrappedDevice(device)), chrome) ?? null,
  };
}

/** Identities received in a message; each kind is read as previewIdentityFrom does. */
export function previewIdentitiesFrom(value: unknown): PreviewIdentities | null | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const { wrapped, direct } = value as Record<string, unknown>;
  return { wrapped: previewIdentityFrom(wrapped), direct: previewIdentityFrom(direct) };
}

/** An identity received in a message: null asks for the browser's own, anything malformed is ignored. */
export function previewIdentityFrom(value: unknown): PreviewIdentity | null | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const { userAgent, hints } = value as Record<string, unknown>;
  if (typeof userAgent !== "string" || !userAgent || userAgent.length > MAX_USER_AGENT || !/^[\x20-\x7e]+$/.test(userAgent)) return undefined;
  if (hints === undefined) return { userAgent };
  if (!hints || typeof hints !== "object") return undefined;
  const { mobile, platform } = hints as Record<string, unknown>;
  if (typeof mobile !== "boolean" || typeof platform !== "string" || !/^[A-Za-z ]{1,32}$/.test(platform)) return undefined;
  return { userAgent, hints: { mobile, platform } };
}
