import type { Device } from "../device/device.types";
import { PREVIEW_FRAME_NAME } from "./preview-request";
import { getFrameProfile } from "../device/frame-profiles";

/**
 * How a preview's requests introduce themselves to the website: the browser
 * of the device being shown. A site that chooses its mobile or desktop page
 * on the server reads the User-Agent and client hints, not the frame size.
 */
export interface PreviewIdentity {
  userAgent: string;
  /** The platform the browser would name in its client hints. */
  platform: IdentityPlatform;
  mobile: boolean;
  /** Whether this browser sends client hints at all: Chrome does, Safari and TV browsers do not. */
  hints: boolean;
}
export type IdentityPlatform = "iOS" | "macOS" | "Android" | "Windows" | "Chrome OS" | "Linux";
const PLATFORMS: readonly IdentityPlatform[] = ["iOS", "macOS", "Android", "Windows", "Chrome OS", "Linux"];

const FALLBACK_CHROME_MAJOR = 140;
/** Safari's version follows the OS: iOS, iPadOS and macOS 26 ship Safari 26. */
const CURRENT_SAFARI_MAJOR = 26;
const MAX_USER_AGENT = 400;
/** The major version of the Chrome running the viewer, so a Chrome identity matches its brands. */
export function chromeMajor(userAgent: string): number {
  const match = /Chrome\/(\d+)/.exec(userAgent);
  return match ? Number(match[1]) : FALLBACK_CHROME_MAJOR;
}

// A device's catalog OS version shapes its browser chrome; its Safari is never
// older than today's, so no site takes the preview for an outdated browser.
const osMajor = (device: Device) => Math.max(getFrameProfile(device).osMajor, CURRENT_SAFARI_MAJOR);
const safari = (platform: IdentityPlatform, ua: string, version: number): PreviewIdentity => ({
  userAgent: `Mozilla/5.0 (${ua}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 ${ua.startsWith("iPhone") ? "Mobile/15E148 Safari/604.1" : "Safari/605.1.15"}`,
  platform, mobile: platform === "iOS", hints: false,
});
const chromeOn = (platform: IdentityPlatform, ua: string, chrome: number, mobile = false): PreviewIdentity => ({
  userAgent: `Mozilla/5.0 (${ua}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome}.0.0.0 ${mobile ? "Mobile " : ""}Safari/537.36`,
  platform, mobile, hints: true,
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
    if (ios && type === "phone") return safari("iOS", `iPhone; CPU iPhone OS ${osMajor(device)}_0 like Mac OS X`, osMajor(device));
    if (ios) return safari("macOS", "Macintosh; Intel Mac OS X 10_15_7", osMajor(device));
    return chromeOn("Android", "Linux; Android 10; K", chrome, type === "phone");
  }
  if (type === "laptop" || type === "desktop") {
    if (/macos/i.test(os)) return safari("macOS", "Macintosh; Intel Mac OS X 10_15_7", osMajor(device));
    if (/windows/i.test(os)) return chromeOn("Windows", "Windows NT 10.0; Win64; x64", chrome);
    if (/chrome\s?os/i.test(os)) return chromeOn("Chrome OS", "X11; CrOS x86_64 14541.0.0", chrome);
    return undefined;
  }
  if (type === "tv" && /tizen/i.test(os)) {
    return { userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Chrome/108.0.5359.1 TV Safari/537.36", platform: "Linux", mobile: false, hints: false };
  }
  return undefined;
}

/** Each direct preview has its own request identity; null removes its rule. */
export type PreviewIdentities = Record<string, PreviewIdentity | null>;

/** An identity received in a message: null asks for the browser's own, anything malformed is ignored. */
export function previewIdentityFrom(value: unknown): PreviewIdentity | null | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const { userAgent, platform, mobile, hints } = value as Record<string, unknown>;
  if (typeof userAgent !== "string" || !userAgent || userAgent.length > MAX_USER_AGENT || !/^[\x20-\x7e]+$/.test(userAgent)) return undefined;
  if (!PLATFORMS.includes(platform as IdentityPlatform) || typeof mobile !== "boolean" || typeof hints !== "boolean") return undefined;
  return { userAgent, platform: platform as IdentityPlatform, mobile, hints };
}

const MAX_PREVIEW_FRAMES = 300;
/** Validate the bounded per-frame map received from the viewer. */
export function previewIdentitiesFrom(value: unknown): PreviewIdentities | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid preview identities.");
  const entries = Object.entries(value);
  if (entries.length > MAX_PREVIEW_FRAMES) throw new Error("Too many preview identities.");
  const result: PreviewIdentities = {};
  for (const [name, identity] of entries) {
    const read = previewIdentityFrom(identity);
    if (!PREVIEW_FRAME_NAME.test(name) || read === undefined) throw new Error("Invalid preview identity.");
    result[name] = read;
  }
  return result;
}
