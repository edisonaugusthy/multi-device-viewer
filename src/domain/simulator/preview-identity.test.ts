import { describe, expect, it } from "vitest";
import { devices } from "../device/device-catalog";
import { createCustomDevice } from "../device/device-service";
import type { Device } from "../device/device.types";
import { getFrameProfile } from "../device/frame-profiles";
import { chromeMajor, deviceIdentity, previewIdentity, previewIdentityFrom } from "./preview-identity";

const device = (id: string) => devices.find(candidate => candidate.id === id)!;
const first = (type: Device["type"], os: RegExp) => devices.find(candidate => candidate.type === type && os.test(candidate.os))!;
const CHROME = 141;
const CHROME_UA = (platform: string, mobile = false) => `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 ${mobile ? "Mobile " : ""}Safari/537.36`;
// Safari's version follows the device's OS version, never older than today's Safari.
const MAC_SAFARI = (version = 26) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`;

describe("the browser a preview identifies as", () => {
  it("reads the viewer's Chrome version and falls back to a recent one", () => {
    expect(chromeMajor("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")).toBe(141);
    expect(chromeMajor("Mozilla/5.0 (Macintosh) Safari/605.1.15")).toBe(140);
  });

  it("makes an iPhone Safari of its iOS version, without client hints", () => {
    expect(deviceIdentity(device("apple-iphone-18-pro-2026"), CHROME)).toEqual({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1",
    });
  });

  it("makes iPads and Macs desktop Safari, as an iPad asks for desktop pages", () => {
    // The iPad mini (6th generation) and MacBook Pro 16-inch (2021) carry older OS versions for their chrome.
    expect(getFrameProfile(device("apple-ipad-mini-6")).osMajor).toBeLessThan(26);
    expect(deviceIdentity(device("apple-ipad-mini-6"), CHROME)).toEqual({ userAgent: MAC_SAFARI() });
    expect(deviceIdentity(device("apple-ipad-pro-13-m4-2024"), CHROME)).toEqual({ userAgent: MAC_SAFARI() });
    expect(deviceIdentity(device("macbook-pro-16-2021"), CHROME)).toEqual({ userAgent: MAC_SAFARI() });
    expect(deviceIdentity(first("desktop", /macos/i), CHROME)).toEqual({ userAgent: MAC_SAFARI() });
    expect(deviceIdentity(first("phone", /^iOS$/), CHROME)?.userAgent).toContain("CPU iPhone OS 26_0");
  });

  it("makes Android phones and tablets the viewer's Chrome in its reduced form, hinting the form factor", () => {
    expect(deviceIdentity(first("phone", /android/i), CHROME)).toEqual({ userAgent: CHROME_UA("Linux; Android 10; K", true), hints: { mobile: true, platform: "Android" } });
    expect(deviceIdentity(first("tablet", /android/i), CHROME)).toEqual({ userAgent: CHROME_UA("Linux; Android 10; K"), hints: { mobile: false, platform: "Android" } });
    expect(deviceIdentity(createCustomDevice({ name: "Shop tablet", width: 800, height: 1280, pixelRatio: 2, type: "tablet" }), CHROME)?.hints).toEqual({ mobile: false, platform: "Android" });
  });

  it("makes Windows and ChromeOS computers the viewer's Chrome on that platform", () => {
    expect(deviceIdentity(first("laptop", /windows/i), CHROME)).toEqual({ userAgent: CHROME_UA("Windows NT 10.0; Win64; x64"), hints: { mobile: false, platform: "Windows" } });
    expect(deviceIdentity(first("desktop", /windows/i), CHROME)).toEqual({ userAgent: CHROME_UA("Windows NT 10.0; Win64; x64"), hints: { mobile: false, platform: "Windows" } });
    expect(deviceIdentity(first("laptop", /chromeos/i), CHROME)).toEqual({ userAgent: CHROME_UA("X11; CrOS x86_64 14541.0.0"), hints: { mobile: false, platform: "Chrome OS" } });
  });

  it("gives a Tizen TV its own browser and leaves watches and kiosks as the viewer itself", () => {
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
      if (/android/i.test(candidate.os)) expect(identity!.hints?.mobile, candidate.id).toBe(candidate.type === "phone");
    }
  });

  it("lets the most phone-like device in a tab speak for all of its previews", () => {
    const iphone = device("apple-iphone-18-pro-2026");
    const mac = first("laptop", /macos/i), windows = first("laptop", /windows/i);
    const ipad = first("tablet", /ipados/i), tablet = first("tablet", /android/i);
    const watch = first("watch", /watchos/i);
    expect(previewIdentity([mac, tablet, iphone], CHROME)).toEqual(deviceIdentity(iphone, CHROME));
    expect(previewIdentity([mac, ipad, tablet], CHROME)).toEqual(deviceIdentity(ipad, CHROME));
    expect(previewIdentity([windows, mac], CHROME)).toEqual(deviceIdentity(windows, CHROME));
    expect(previewIdentity([watch, mac], CHROME)).toEqual(deviceIdentity(mac, CHROME));
    expect(previewIdentity([watch], CHROME)).toBeUndefined();
    expect(previewIdentity([], CHROME)).toBeUndefined();
  });

  it("accepts only a well-formed identity from a message, and null as the browser's own", () => {
    const identity = deviceIdentity(device("apple-iphone-18-pro-2026"), CHROME);
    expect(previewIdentityFrom(identity)).toEqual(identity);
    expect(previewIdentityFrom({ userAgent: "Agent", hints: { mobile: true, platform: "Android" } })).toEqual({ userAgent: "Agent", hints: { mobile: true, platform: "Android" } });
    expect(previewIdentityFrom(null)).toBeNull();
    for (const bad of [undefined, "Agent", 7, {}, { userAgent: "" }, { userAgent: "Agent\r\nX-Injected: 1" }, { userAgent: "A".repeat(401) },
      { userAgent: "Agent", hints: "mobile" }, { userAgent: "Agent", hints: { mobile: "yes", platform: "Android" } }, { userAgent: "Agent", hints: { mobile: true, platform: "And\"roid" } }]) {
      expect(previewIdentityFrom(bad), JSON.stringify(bad)).toBeUndefined();
    }
  });
});
