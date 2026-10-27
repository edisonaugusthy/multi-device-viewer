import { describe, expect, it } from "vitest";
import { devices } from "../device/device-catalog";
import { createCustomDevice } from "../device/device-service";
import type { Device } from "../device/device.types";
import { getFrameProfile } from "../device/frame-profiles";
import {
  chromeMajor, deviceIdentity, previewIdentitiesFrom, previewIdentityFrom,
  type PreviewIdentity,
} from "./preview-identity";

const device = (id: string) => devices.find(candidate => candidate.id === id)!;
const first = (type: Device["type"], os: RegExp) => devices.find(candidate => candidate.type === type && os.test(candidate.os))!;
const CHROME = 141;
const CHROME_UA = (platform: string, mobile = false) => `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 ${mobile ? "Mobile " : ""}Safari/537.36`;
// Safari's version follows the device's OS version, never older than today's Safari.
const MAC_SAFARI = (version = 26): PreviewIdentity => ({
  userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`,
  platform: "macOS", mobile: false, hints: false,
});

describe("the browser a preview identifies as", () => {
  it("reads the viewer's Chrome version and falls back to a recent one", () => {
    expect(chromeMajor("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")).toBe(141);
    expect(chromeMajor("Mozilla/5.0 (Macintosh) Safari/605.1.15")).toBe(140);
  });

  it("makes an iPhone Safari of its iOS version, a mobile browser without client hints", () => {
    expect(deviceIdentity(device("apple-iphone-18-pro-2026"), CHROME)).toEqual({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1",
      platform: "iOS", mobile: true, hints: false, touchPoints: 5,
    });
    expect(deviceIdentity(first("phone", /^iOS$/), CHROME)?.userAgent).toContain("CPU iPhone OS 26_0");
  });

  it("makes iPads and Macs desktop Safari, as an iPad asks for desktop pages", () => {
    // The iPad mini (6th generation) and MacBook Pro 16-inch (2021) carry older OS versions for their chrome.
    expect(getFrameProfile(device("apple-ipad-mini-6")).osMajor).toBeLessThan(26);
    // Only its touch points tell an iPad from a Mac, as in Safari.
    expect(deviceIdentity(device("apple-ipad-mini-6"), CHROME)).toEqual({ ...MAC_SAFARI(), touchPoints: 5 });
    expect(deviceIdentity(device("apple-ipad-pro-13-m4-2024"), CHROME)).toEqual({ ...MAC_SAFARI(), touchPoints: 5 });
    expect(deviceIdentity(device("macbook-pro-16-2021"), CHROME)).toEqual(MAC_SAFARI());
    expect(deviceIdentity(first("desktop", /macos/i), CHROME)).toEqual(MAC_SAFARI());
  });

  it("makes Android phones and tablets the viewer's Chrome in its reduced form, with the model, version and form factor in its hints", () => {
    expect(deviceIdentity(device("google-pixel-8"), CHROME)).toEqual({
      userAgent: CHROME_UA("Linux; Android 10; K", true), platform: "Android", mobile: true, hints: true, touchPoints: 5,
      details: { model: "Pixel 8", platformVersion: "16.0.0", formFactor: "Mobile", architecture: "", bitness: "" },
    });
    // A catalog name's posture is not part of the model, and a device without an Android version gets today's.
    expect(deviceIdentity(device("samsung-galaxy-z-fold8-folded-2026"), CHROME)?.details).toMatchObject({ model: "Galaxy Z Fold8", platformVersion: "16.0.0" });
    expect(deviceIdentity(first("tablet", /android/i), CHROME)).toMatchObject({ userAgent: CHROME_UA("Linux; Android 10; K"), platform: "Android", mobile: false, hints: true, details: { formFactor: "Tablet" } });
    expect(deviceIdentity(createCustomDevice({ name: "Shop tablet", width: 800, height: 1280, pixelRatio: 2, type: "tablet" }), CHROME)).toMatchObject({ platform: "Android", mobile: false, hints: true, details: { model: "" } });
  });

  it("tells two Android phones apart by model", () => {
    const models = devices.filter(item => item.type === "phone" && /android/i.test(item.os) && item.brand !== "Custom").map(item => deviceIdentity(item, CHROME)?.details?.model);
    expect(models.every(model => model && model.length <= 64 && /^[\x20-\x7e]+$/.test(model) && !/["\\]/.test(model))).toBe(true);
    expect(deviceIdentity(device("google-pixel-8"), CHROME)).not.toEqual(deviceIdentity(device("samsung-galaxy-s24"), CHROME));
  });

  it("makes Windows and ChromeOS computers the viewer's Chrome on that platform", () => {
    const desktop = (platformVersion: string) => ({ model: "", platformVersion, formFactor: "Desktop", architecture: "x86", bitness: "64" });
    expect(deviceIdentity(first("laptop", /windows/i), CHROME)).toEqual({ userAgent: CHROME_UA("Windows NT 10.0; Win64; x64"), platform: "Windows", mobile: false, hints: true, details: desktop("19.0.0") });
    expect(deviceIdentity(first("desktop", /windows/i), CHROME)).toEqual({ userAgent: CHROME_UA("Windows NT 10.0; Win64; x64"), platform: "Windows", mobile: false, hints: true, details: desktop("19.0.0") });
    expect(deviceIdentity(first("laptop", /chromeos/i), CHROME)).toEqual({ userAgent: CHROME_UA("X11; CrOS x86_64 14541.0.0"), platform: "Chrome OS", mobile: false, hints: true, details: desktop("14541.0.0") });
  });

  it("gives a Tizen TV its own browser and leaves watches and kiosks as the viewer itself", () => {
    expect(deviceIdentity(first("tv", /tizen/i), CHROME)).toMatchObject({ platform: "Linux", mobile: false, hints: false });
    expect(deviceIdentity(first("tv", /tizen/i), CHROME)?.userAgent).toMatch(/^Mozilla\/5\.0 \(SMART-TV; Linux; Tizen 8\.0\).* TV Safari\/537\.36$/);
    for (const candidate of devices.filter(item => item.type === "watch" || item.type === "custom")) expect(deviceIdentity(candidate, CHROME), candidate.id).toBeUndefined();
    expect(deviceIdentity(createCustomDevice({ name: "Wall panel", width: 1024, height: 600, pixelRatio: 1, type: "desktop" }), CHROME)).toBeUndefined();
  });

  it("gives every catalog phone, tablet, laptop, desktop and TV a browser of its own OS", () => {
    for (const candidate of devices.filter(item => ["phone", "tablet", "laptop", "desktop", "tv"].includes(item.type))) {
      const identity = deviceIdentity(candidate, CHROME);
      expect(identity, candidate.id).toBeDefined();
      const expected = /ios|ipados|macos/i.test(candidate.os) ? /Safari\/60[45]/ : /tizen/i.test(candidate.os) ? /Tizen/ : /Chrome\/141/;
      expect(identity!.userAgent, candidate.id).toMatch(expected);
      expect(identity!.hints, candidate.id).toBe(/android|windows|chromeos/i.test(candidate.os));
      if (/android/i.test(candidate.os)) expect(identity!.mobile, candidate.id).toBe(candidate.type === "phone");
    }
  });

  it("validates per-frame identities without merging devices into classes", () => {
    const identities = { "mdv-mobile-preview-a": deviceIdentity(device("apple-iphone-18-pro-2026"), CHROME), "mdv-preview-b": MAC_SAFARI(), "mdv-preview-c": null };
    expect(previewIdentitiesFrom(identities)).toEqual(identities);
    expect(previewIdentitiesFrom(undefined)).toBeUndefined();
    for (const bad of [null, [], 7, { wrapped: MAC_SAFARI() }, { "mdv-preview-a": "bad" }, { "mdv-preview-*": MAC_SAFARI() }, Object.fromEntries(Array.from({ length: 301 }, (_, n) => [`mdv-preview-${n}`, MAC_SAFARI()]))]) {
      expect(() => previewIdentitiesFrom(bad)).toThrow();
    }
  });

  it("accepts only a well-formed identity from a message, and null as the browser's own", () => {
    const identity = deviceIdentity(device("apple-iphone-18-pro-2026"), CHROME);
    expect(previewIdentityFrom(identity)).toEqual(identity);
    expect(previewIdentityFrom(null)).toBeNull();
    const good: PreviewIdentity = { userAgent: "Agent", platform: "Android", mobile: true, hints: true };
    expect(previewIdentityFrom(good)).toEqual(good);
    const pixel = deviceIdentity(device("google-pixel-8"), CHROME)!;
    expect(previewIdentityFrom(pixel)).toEqual(pixel);
    const localized = { ...pixel, language: "zh-Hant-TW", density: { dpr: 2.625, width: 412 } };
    expect(previewIdentityFrom(localized)).toEqual(localized);
    for (const bad of [{ ...pixel, language: "german" }, { ...pixel, language: "de_DE" }, { ...pixel, density: { dpr: 9, width: 412 } }, { ...pixel, density: { dpr: 2, width: 1.5 } }]) {
      expect(previewIdentityFrom(bad), JSON.stringify(bad)).toBeUndefined();
    }
    const details = pixel.details!;
    for (const bad of [undefined, "Agent", 7, {}, { ...good, userAgent: "" }, { ...good, userAgent: "Agent\r\nX-Injected: 1" }, { ...good, userAgent: "A".repeat(401) },
      { ...good, platform: "Amiga" }, { ...good, mobile: "yes" }, { ...good, hints: undefined }, { ...good, touchPoints: 11 }, { ...good, touchPoints: 1.5 },
      { ...pixel, hints: false }, { ...pixel, details: { ...details, model: 'Pixel"8' } }, { ...pixel, details: { ...details, model: "Pixel\\8" } },
      { ...pixel, details: { ...details, model: "P".repeat(65) } }, { ...pixel, details: { ...details, formFactor: "Watch" } }, { ...pixel, details: { ...details, bitness: 64 } }]) {
      expect(previewIdentityFrom(bad), JSON.stringify(bad)).toBeUndefined();
    }
  });
});
