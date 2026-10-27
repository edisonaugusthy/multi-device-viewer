import type { Device } from "../device/device.types";
import { getFrameProfile } from "../device/frame-profiles";

/** The name of a preview's frame element, which says whose identity its requests and scripts take. */
export const PREVIEW_FRAME_NAME = /^mdv-(?:mobile-)?preview-[\w-]{1,160}$/;

/**
 * How a preview introduces itself to the website: the browser of the device
 * being shown. A site that chooses its mobile or desktop page on the server
 * reads the User-Agent and client hints, and one that chooses in the page
 * reads navigator, not the frame size.
 */
export interface PreviewIdentity {
  userAgent: string;
  /** The platform the browser would name in its client hints. */
  platform: IdentityPlatform;
  mobile: boolean;
  /** Whether this browser sends client hints at all: Chrome does, Safari and TV browsers do not. */
  hints: boolean;
  /** Touch points the device reports; an iPad passes for a Mac except here. */
  touchPoints?: number;
  /** What a Chrome identity tells beyond its reduced User-Agent, in its high-entropy client hints. */
  details?: IdentityDetails;
  /** The language this device asks for (Accept-Language) and its scripts read; the browser's own when left out. */
  language?: string;
  /** The screen's pixel ratio and CSS width, sent as Sec-CH-DPR and Sec-CH-Viewport-Width for image servers. */
  density?: { dpr: number; width: number };
}
export interface IdentityDetails {
  model: string;
  platformVersion: string;
  formFactor: FormFactor;
  architecture: string;
  bitness: string;
}
export type IdentityPlatform = "iOS" | "macOS" | "Android" | "Windows" | "Chrome OS" | "Linux";
export type FormFactor = "Mobile" | "Tablet" | "Desktop";
const PLATFORMS: readonly IdentityPlatform[] = ["iOS", "macOS", "Android", "Windows", "Chrome OS", "Linux"];
const FORM_FACTORS: readonly FormFactor[] = ["Mobile", "Tablet", "Desktop"];
const TOUCH_POINTS = 5;

const FALLBACK_CHROME_MAJOR = 140;
/** Safari's version follows the OS: iOS, iPadOS and macOS 26 ship Safari 26. */
const CURRENT_SAFARI_MAJOR = 26;
const MAX_USER_AGENT = 400;
const MAX_DETAIL = 64;
/** A BCP 47 tag of the shape browsers send: "de", "pt-BR", "zh-Hant-TW". */
export const LANGUAGE_TAG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/;
/** Android's version when the catalog does not say. */
const CURRENT_ANDROID_MAJOR = 16;
/** Windows 11 24H2 reports platform version 19; Windows 10 reports 10. */
const WINDOWS_PLATFORM_VERSION = { 10: "10.0.0", 11: "19.0.0" } as const;
/** The ChromeOS build its reduced User-Agent names. */
const CHROMEOS_PLATFORM_VERSION = "14541.0.0";
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
const chromeOn = (platform: IdentityPlatform, ua: string, chrome: number, details: IdentityDetails, mobile = false): PreviewIdentity => ({
  userAgent: `Mozilla/5.0 (${ua}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome}.0.0.0 ${mobile ? "Mobile " : ""}Safari/537.36`,
  platform, mobile, hints: true, details,
});
const touch = (device: Device) => device.type === "phone" || device.type === "tablet" ? { touchPoints: TOUCH_POINTS } : {};
/** The model Android reports, from the catalog name: "Samsung Galaxy Z Fold8 (folded)" is "Galaxy Z Fold8". A custom device has none. */
function androidModel(device: Device): string {
  if (device.brand === "Custom") return "";
  const name = device.name.startsWith(`${device.brand} `) ? device.name.slice(device.brand.length + 1) : device.name;
  return name.replace(/\s*\(.*\)\s*$/, "").replace(/[^\x20-\x7e]|["\\]/g, "").trim().slice(0, MAX_DETAIL);
}

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
    const profile = getFrameProfile(device);
    const ios = profile.platform === "ios";
    if (ios && type === "phone") return { ...safari("iOS", `iPhone; CPU iPhone OS ${osMajor(device)}_0 like Mac OS X`, osMajor(device)), ...touch(device) };
    if (ios) return { ...safari("macOS", "Macintosh; Intel Mac OS X 10_15_7", osMajor(device)), ...touch(device) };
    const details: IdentityDetails = {
      model: androidModel(device), platformVersion: `${profile.osMajor || CURRENT_ANDROID_MAJOR}.0.0`,
      formFactor: type === "phone" ? "Mobile" : "Tablet", architecture: "", bitness: "",
    };
    return { ...chromeOn("Android", "Linux; Android 10; K", chrome, details, type === "phone"), ...touch(device) };
  }
  if (type === "laptop" || type === "desktop") {
    const desktop = (platformVersion: string): IdentityDetails => ({ model: "", platformVersion, formFactor: "Desktop", architecture: "x86", bitness: "64" });
    if (/macos/i.test(os)) return safari("macOS", "Macintosh; Intel Mac OS X 10_15_7", osMajor(device));
    if (/windows/i.test(os)) return chromeOn("Windows", "Windows NT 10.0; Win64; x64", chrome, desktop(WINDOWS_PLATFORM_VERSION[/\b10\b/.test(os) ? 10 : 11]));
    if (/chrome\s?os/i.test(os)) return chromeOn("Chrome OS", `X11; CrOS x86_64 ${CHROMEOS_PLATFORM_VERSION}`, chrome, desktop(CHROMEOS_PLATFORM_VERSION));
    return undefined;
  }
  if (type === "tv" && /tizen/i.test(os)) {
    return { userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Chrome/108.0.5359.1 TV Safari/537.36", platform: "Linux", mobile: false, hints: false };
  }
  return undefined;
}

/**
 * A workspace device's identity with its own settings: the language it asks
 * for and, unless turned off, its screen density and current CSS width.
 */
export function slotIdentity(device: Device, chrome: number, settings: { language?: string; sendDensity?: boolean; width: number }): PreviewIdentity | undefined {
  const base = deviceIdentity(device, chrome);
  if (!base) return undefined;
  const identity: PreviewIdentity = { ...base };
  if (settings.language && LANGUAGE_TAG.test(settings.language)) identity.language = settings.language;
  if (settings.sendDensity !== false && device.pixelRatio >= 0.5 && device.pixelRatio <= 5 && settings.width >= 1) {
    identity.density = { dpr: Math.round(device.pixelRatio * 1000) / 1000, width: Math.round(settings.width) };
  }
  return identity;
}

/** Each direct preview has its own request identity; null removes its rule. */
export type PreviewIdentities = Record<string, PreviewIdentity | null>;

/** An identity received in a message: null asks for the browser's own, anything malformed is ignored. */
export function previewIdentityFrom(value: unknown): PreviewIdentity | null | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const { userAgent, platform, mobile, hints, touchPoints, details, language, density } = value as Record<string, unknown>;
  if (typeof userAgent !== "string" || !userAgent || userAgent.length > MAX_USER_AGENT || !/^[\x20-\x7e]+$/.test(userAgent)) return undefined;
  if (!PLATFORMS.includes(platform as IdentityPlatform) || typeof mobile !== "boolean" || typeof hints !== "boolean") return undefined;
  if (touchPoints !== undefined && !(Number.isInteger(touchPoints) && (touchPoints as number) >= 0 && (touchPoints as number) <= 10)) return undefined;
  const identity: PreviewIdentity = { userAgent, platform: platform as IdentityPlatform, mobile, hints };
  if (touchPoints !== undefined) identity.touchPoints = touchPoints as number;
  if (language !== undefined) {
    if (typeof language !== "string" || !LANGUAGE_TAG.test(language)) return undefined;
    identity.language = language;
  }
  if (density !== undefined) {
    const { dpr, width } = (density ?? {}) as Record<string, unknown>;
    if (typeof dpr !== "number" || !(dpr >= 0.5 && dpr <= 5) || !Number.isInteger(width) || !((width as number) >= 1 && (width as number) <= 10000)) return undefined;
    identity.density = { dpr, width: width as number };
  }
  if (details === undefined) return identity;
  const read = identityDetailsFrom(details);
  return read && hints ? { ...identity, details: read } : undefined;
}

// Client hint values travel as quoted strings in headers, so they stay short printable ASCII without quotes or backslashes.
const detail = (value: unknown) => typeof value === "string" && value.length <= MAX_DETAIL && /^[\x20-\x21\x23-\x5b\x5d-\x7e]*$/.test(value);
function identityDetailsFrom(value: unknown): IdentityDetails | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { model, platformVersion, formFactor, architecture, bitness } = value as Record<string, unknown>;
  if (![model, platformVersion, architecture, bitness].every(detail) || !FORM_FACTORS.includes(formFactor as FormFactor)) return undefined;
  return { model, platformVersion, formFactor, architecture, bitness } as IdentityDetails;
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
