import type { Device } from "../device/device.types";
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

/**
 * One identity per kind of frame: request rules apply to every preview frame
 * of a site in the tab, so the most phone-like device speaks for all of them.
 * Phones come first, then tablets, laptops, desktops and TVs; among equals,
 * the first in the workspace.
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

/**
 * Which previews load wrapped and what each kind of frame identifies as,
 * decided from the devices on screen. Of the distinct browsers shown, the
 * most phone-like one takes the wrapped class with every device of that
 * rank (a Pixel beside an iPhone is still a phone), and the least phone-like
 * one the direct class, so an iPhone and a MacBook, or an Android tablet and
 * an iPad, or a MacBook and a Surface, each get their own page. A third
 * browser shares the class nearer to it. Without `split` (the simulator
 * page, whose frames all start from the extension), every frame is in the
 * wrapped class and the most phone-like device speaks for all.
 */
export interface FramePlan { wrapped: Set<string>; identities: PreviewIdentities }
export interface FrameSpec { name: string; device: Device }
/** How phone-like a browser is: phones, then Android tablets, then computers, then TVs. */
const rank = (identity: PreviewIdentity) => identity.mobile ? 0 : identity.platform === "Android" ? 1 : identity.platform === "Linux" ? 3 : 2;
export function planPreviewFrames(frames: FrameSpec[], chrome: number, split: boolean): FramePlan {
  if (!split) return { wrapped: new Set(), identities: { wrapped: previewIdentity(frames.map(frame => frame.device), chrome) ?? null, direct: null } };
  const known = frames.map(frame => ({ frame, identity: deviceIdentity(frame.device, chrome) })).filter((entry): entry is { frame: FrameSpec; identity: PreviewIdentity } => Boolean(entry.identity));
  const distinct: PreviewIdentity[] = [];
  for (const { identity } of known) if (!distinct.some(seen => seen.userAgent === identity.userAgent)) distinct.push(identity);
  distinct.sort((a, b) => rank(a) - rank(b));
  if (distinct.length < 2) return { wrapped: new Set(), identities: { wrapped: null, direct: distinct[0] ?? null } };
  const first = distinct[0];
  const oneRank = distinct.every(identity => rank(identity) === rank(first));
  const wrappedEntries = known.filter(({ identity }) => oneRank ? identity.userAgent === first.userAgent : rank(identity) === rank(first));
  const rest = known.filter(entry => !wrappedEntries.includes(entry));
  const farthest = Math.max(...rest.map(({ identity }) => rank(identity)));
  const direct = rest.find(({ identity }) => rank(identity) === farthest)?.identity ?? null;
  return { wrapped: new Set(wrappedEntries.map(({ frame }) => frame.name)), identities: { wrapped: first, direct } };
}

/**
 * With exact identities, every preview frame gets its own device's browser
 * through the debugger, keyed by the frame's name; the request rules then
 * leave identities alone (see exact-identities.ts).
 */
export const EXACT_RULE_IDENTITIES: PreviewIdentities = { wrapped: null, direct: null };
export type ExactIdentities = Record<string, PreviewIdentity>;
export function exactIdentities(frames: Array<{ name: string; device: Device }>, chrome: number): ExactIdentities {
  const result: ExactIdentities = {};
  for (const frame of frames) {
    const identity = deviceIdentity(frame.device, chrome);
    if (identity) result[frame.name] = identity;
  }
  return result;
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
  const { userAgent, platform, mobile, hints } = value as Record<string, unknown>;
  if (typeof userAgent !== "string" || !userAgent || userAgent.length > MAX_USER_AGENT || !/^[\x20-\x7e]+$/.test(userAgent)) return undefined;
  if (!PLATFORMS.includes(platform as IdentityPlatform) || typeof mobile !== "boolean" || typeof hints !== "boolean") return undefined;
  return { userAgent, platform: platform as IdentityPlatform, mobile, hints };
}

const MAX_EXACT_FRAMES = 300;
const FRAME_NAME = /^mdv-(?:mobile-)?preview-[\w-]+$/;
/** Exact identities received in a message, by frame name: null turns them off, anything malformed is ignored. */
export function exactIdentitiesFrom(value: unknown): ExactIdentities | null | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_EXACT_FRAMES);
  const result: ExactIdentities = {};
  for (const [name, identity] of entries) {
    const read = FRAME_NAME.test(name) ? previewIdentityFrom(identity) : undefined;
    if (read) result[name] = read;
  }
  return result;
}
