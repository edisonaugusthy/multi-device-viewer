import { describe, expect, it } from "vitest";
import { devices } from "../device/device-catalog";
import { createCustomDevice } from "../device/device-service";
import type { Device } from "../device/device.types";
import { getFrameProfile } from "../device/frame-profiles";
import {
  chromeMajor, deviceIdentity, exactIdentities, exactIdentitiesFrom, planPreviewFrames, previewIdentitiesFrom, previewIdentity, previewIdentityFrom,
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
      platform: "iOS", mobile: true, hints: false,
    });
    expect(deviceIdentity(first("phone", /^iOS$/), CHROME)?.userAgent).toContain("CPU iPhone OS 26_0");
  });

  it("makes iPads and Macs desktop Safari, as an iPad asks for desktop pages", () => {
    // The iPad mini (6th generation) and MacBook Pro 16-inch (2021) carry older OS versions for their chrome.
    expect(getFrameProfile(device("apple-ipad-mini-6")).osMajor).toBeLessThan(26);
    expect(deviceIdentity(device("apple-ipad-mini-6"), CHROME)).toEqual(MAC_SAFARI());
    expect(deviceIdentity(device("apple-ipad-pro-13-m4-2024"), CHROME)).toEqual(MAC_SAFARI());
    expect(deviceIdentity(device("macbook-pro-16-2021"), CHROME)).toEqual(MAC_SAFARI());
    expect(deviceIdentity(first("desktop", /macos/i), CHROME)).toEqual(MAC_SAFARI());
  });

  it("makes Android phones and tablets the viewer's Chrome in its reduced form, hinting the form factor", () => {
    expect(deviceIdentity(first("phone", /android/i), CHROME)).toEqual({ userAgent: CHROME_UA("Linux; Android 10; K", true), platform: "Android", mobile: true, hints: true });
    expect(deviceIdentity(first("tablet", /android/i), CHROME)).toEqual({ userAgent: CHROME_UA("Linux; Android 10; K"), platform: "Android", mobile: false, hints: true });
    expect(deviceIdentity(createCustomDevice({ name: "Shop tablet", width: 800, height: 1280, pixelRatio: 2, type: "tablet" }), CHROME)).toMatchObject({ platform: "Android", mobile: false, hints: true });
  });

  it("makes Windows and ChromeOS computers the viewer's Chrome on that platform", () => {
    expect(deviceIdentity(first("laptop", /windows/i), CHROME)).toEqual({ userAgent: CHROME_UA("Windows NT 10.0; Win64; x64"), platform: "Windows", mobile: false, hints: true });
    expect(deviceIdentity(first("desktop", /windows/i), CHROME)).toEqual({ userAgent: CHROME_UA("Windows NT 10.0; Win64; x64"), platform: "Windows", mobile: false, hints: true });
    expect(deviceIdentity(first("laptop", /chromeos/i), CHROME)).toEqual({ userAgent: CHROME_UA("X11; CrOS x86_64 14541.0.0"), platform: "Chrome OS", mobile: false, hints: true });
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

  it("splits the devices on screen into two classes: the most phone-like browser wrapped, the least phone-like direct", () => {
    const iphone = device("apple-iphone-18-pro-2026"), pixel = first("phone", /android/i);
    const mac = first("laptop", /macos/i), windows = first("laptop", /windows/i), chromebook = first("laptop", /chromeos/i);
    const ipad = first("tablet", /ipados/i), tablet = first("tablet", /android/i), watch = first("watch", /watchos/i);
    const frames = (...devices: Device[]) => devices.map((item, index) => ({ name: `mdv-preview-${index}`, device: item }));
    const id = (item: Device) => deviceIdentity(item, CHROME);
    // An iPhone beside a MacBook: each gets its own page; an Android tablet between them joins the desktop side.
    expect(planPreviewFrames(frames(mac, tablet, iphone), CHROME, true)).toEqual({ wrapped: new Set(["mdv-preview-2"]), identities: { wrapped: id(iphone), direct: id(mac) } });
    // Two phones of different kinds are both phones.
    expect(planPreviewFrames(frames(iphone, pixel, mac), CHROME, true)).toEqual({ wrapped: new Set(["mdv-preview-0", "mdv-preview-1"]), identities: { wrapped: id(iphone), direct: id(mac) } });
    // The tablets page: Android tablets wrapped, iPads direct, both exact.
    expect(planPreviewFrames(frames(ipad, tablet), CHROME, true)).toEqual({ wrapped: new Set(["mdv-preview-1"]), identities: { wrapped: id(tablet), direct: id(ipad) } });
    // The laptops page: Macs and Windows laptops get their own browsers; the Chromebook, also Chrome, joins Windows.
    expect(planPreviewFrames(frames(mac, windows, chromebook), CHROME, true)).toEqual({ wrapped: new Set(["mdv-preview-0"]), identities: { wrapped: id(mac), direct: id(windows) } });
    // One browser, or none, needs no wrapping at all.
    expect(planPreviewFrames(frames(mac, mac), CHROME, true)).toEqual({ wrapped: new Set(), identities: { wrapped: null, direct: id(mac) } });
    expect(planPreviewFrames(frames(watch), CHROME, true)).toEqual({ wrapped: new Set(), identities: { wrapped: null, direct: null } });
    // The simulator page cannot wrap: every frame starts from the extension and the most phone-like device speaks for all.
    expect(planPreviewFrames(frames(mac, iphone), CHROME, false)).toEqual({ wrapped: new Set(), identities: { wrapped: id(iphone), direct: null } });
    expect(previewIdentitiesFrom({ wrapped: id(iphone), direct: null })).toEqual({ wrapped: id(iphone), direct: null });
    expect(previewIdentitiesFrom({ wrapped: "bad" })).toEqual({ wrapped: undefined, direct: undefined });
    expect(previewIdentitiesFrom(null)).toBeNull();
    expect(previewIdentitiesFrom("x")).toBeUndefined();
  });

  it("names each frame's own identity for exact mode, leaving out devices without one", () => {
    const iphone = device("apple-iphone-18-pro-2026"), mac = first("laptop", /macos/i), watch = first("watch", /watchos/i);
    const frames = exactIdentities([{ name: "mdv-mobile-preview-a", device: iphone }, { name: "mdv-preview-b", device: mac }, { name: "mdv-preview-c", device: watch }], CHROME);
    expect(frames).toEqual({ "mdv-mobile-preview-a": deviceIdentity(iphone, CHROME), "mdv-preview-b": deviceIdentity(mac, CHROME) });
    expect(exactIdentitiesFrom(frames)).toEqual(frames);
    expect(exactIdentitiesFrom({ ...frames, "not a frame": deviceIdentity(mac, CHROME), "mdv-preview-d": "bad" })).toEqual(frames);
    expect(exactIdentitiesFrom(null)).toBeNull();
    expect(exactIdentitiesFrom(7)).toBeUndefined();
  });

  it("accepts only a well-formed identity from a message, and null as the browser's own", () => {
    const identity = deviceIdentity(device("apple-iphone-18-pro-2026"), CHROME);
    expect(previewIdentityFrom(identity)).toEqual(identity);
    expect(previewIdentityFrom(null)).toBeNull();
    const good: PreviewIdentity = { userAgent: "Agent", platform: "Android", mobile: true, hints: true };
    expect(previewIdentityFrom(good)).toEqual(good);
    for (const bad of [undefined, "Agent", 7, {}, { ...good, userAgent: "" }, { ...good, userAgent: "Agent\r\nX-Injected: 1" }, { ...good, userAgent: "A".repeat(401) },
      { ...good, platform: "Amiga" }, { ...good, mobile: "yes" }, { ...good, hints: undefined }]) {
      expect(previewIdentityFrom(bad), JSON.stringify(bad)).toBeUndefined();
    }
  });
});
