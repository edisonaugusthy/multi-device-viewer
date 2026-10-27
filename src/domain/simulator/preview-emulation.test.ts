import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { identityHeaders, identityScript, readBrowserBrands, type BrowserBrands } from "./preview-emulation";
import type { PreviewIdentity } from "./preview-identity";

const browser: BrowserBrands = {
  brands: [{ brand: "Chromium", version: "141" }, { brand: "Google Chrome", version: "141" }],
  fullVersionList: [{ brand: "Chromium", version: "141.0.7390.54" }, { brand: "Google Chrome", version: "141.0.7390.54" }],
  uaFullVersion: "141.0.7390.54",
};
const iphone: PreviewIdentity = { userAgent: "Mozilla/5.0 (iPhone) Safari", platform: "iOS", mobile: true, hints: false, touchPoints: 5 };
const ipad: PreviewIdentity = { userAgent: "Mozilla/5.0 (Macintosh) Safari", platform: "macOS", mobile: false, hints: false, touchPoints: 5 };
const pixel: PreviewIdentity = {
  userAgent: "Mozilla/5.0 (Linux; Android 10; K) Chrome/141.0.0.0 Mobile Safari/537.36", platform: "Android", mobile: true, hints: true, touchPoints: 5,
  details: { model: "Pixel 8", platformVersion: "16.0.0", formFactor: "Mobile", architecture: "", bitness: "" },
};

describe("device request headers", () => {
  it("drops every client hint for a browser that sends none", () => {
    const headers = identityHeaders(iphone, browser);
    expect(headers["user-agent"]).toBe(iphone.userAgent);
    expect(Object.entries(headers).filter(([name]) => name.startsWith("sec-ch-ua")).every(([, value]) => value === null)).toBe(true);
    expect(Object.keys(headers)).toContain("sec-ch-ua-model");
  });

  it("sends a Chrome device's brands, model, versions and form factor", () => {
    expect(identityHeaders(pixel, browser)).toEqual({
      "user-agent": pixel.userAgent,
      "sec-ch-ua": '"Chromium";v="141", "Google Chrome";v="141"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-ch-ua-platform-version": '"16.0.0"',
      "sec-ch-ua-model": '"Pixel 8"',
      "sec-ch-ua-arch": '""',
      "sec-ch-ua-bitness": '""',
      "sec-ch-ua-wow64": "?0",
      "sec-ch-ua-full-version": '"141.0.7390.54"',
      "sec-ch-ua-full-version-list": '"Chromium";v="141.0.7390.54", "Google Chrome";v="141.0.7390.54"',
      "sec-ch-ua-form-factors": '"Mobile"',
    });
  });

  it("keeps only the low-entropy hints for a Chrome identity without details", () => {
    const headers = identityHeaders({ ...pixel, details: undefined }, browser);
    expect(headers["sec-ch-ua-platform"]).toBe('"Android"');
    expect(headers["sec-ch-ua-model"]).toBeNull();
  });
});

/** A frame's realm, as far as the script reads it: its own navigator, its name and the frames above it. */
function realm(name: string, depth = 1, crossOriginParent = false) {
  class Navigator {}
  class NavigatorUAData {}
  for (const [key, value] of Object.entries({ userAgent: "Desktop Chrome", appVersion: "5.0 Desktop", platform: "MacIntel", vendor: "Google Inc.", maxTouchPoints: 0, userAgentData: { brands: [], mobile: false, platform: "macOS" } })) {
    Object.defineProperty(Navigator.prototype, key, { get: () => value, configurable: true, enumerable: true });
  }
  const top = { name: "" } as Record<string, unknown>;
  const window = { name, top, NavigatorUAData } as Record<string, unknown>;
  let frame = window;
  for (let level = 1; level < depth; level++) {
    const parent = { name: level === depth - 1 ? name : "inner", top } as Record<string, unknown>;
    if (crossOriginParent && level === depth - 1) Object.defineProperty(parent, "name", { get() { throw new Error("SecurityError"); } });
    frame.parent = parent;
    frame = parent;
  }
  frame.parent = top;
  if (depth > 1) window.name = "nested";
  const navigator = new Navigator() as Record<string, unknown>;
  return { context: { window, Navigator, NavigatorUAData, Object, JSON, Promise, Array }, navigator };
}
const run = (identities: Record<string, PreviewIdentity>, frame: ReturnType<typeof realm>) => runInNewContext(identityScript(identities, browser), frame.context);

describe("the device in a preview's scripts", () => {
  it("gives an iPhone preview Safari's navigator, without userAgentData", () => {
    const frame = realm("mdv-mobile-preview-a");
    run({ "mdv-mobile-preview-a": iphone }, frame);
    expect(frame.navigator).toMatchObject({ userAgent: iphone.userAgent, appVersion: "5.0 (iPhone) Safari", platform: "iPhone", vendor: "Apple Computer, Inc.", maxTouchPoints: 5 });
    expect("userAgentData" in frame.navigator).toBe(false);
  });

  it("lets an iPad pass for a Mac except for its touch points", () => {
    const frame = realm("mdv-preview-a");
    run({ "mdv-preview-a": ipad }, frame);
    expect(frame.navigator).toMatchObject({ platform: "MacIntel", maxTouchPoints: 5 });
  });

  it("gives an Android preview Chrome's userAgentData with its high-entropy values", async () => {
    const frame = realm("mdv-preview-a");
    run({ "mdv-preview-a": pixel }, frame);
    const data = frame.navigator.userAgentData as { brands: unknown; mobile: boolean; platform: string; getHighEntropyValues(hints: string[]): Promise<Record<string, unknown>>; toJSON(): unknown };
    expect(frame.navigator).toMatchObject({ platform: "Linux armv81", vendor: "Google Inc.", maxTouchPoints: 5 });
    expect(data).toBeInstanceOf(frame.context.NavigatorUAData);
    expect({ brands: data.brands, mobile: data.mobile, platform: data.platform }).toEqual({ brands: browser.brands, mobile: true, platform: "Android" });
    expect(await data.getHighEntropyValues(["model", "platformVersion", "formFactors", "fullVersionList", "unknown"])).toEqual({
      brands: browser.brands, mobile: true, platform: "Android", model: "Pixel 8", platformVersion: "16.0.0", formFactors: ["Mobile"], fullVersionList: browser.fullVersionList,
    });
    expect(JSON.parse(JSON.stringify(data))).toEqual({ brands: browser.brands, mobile: true, platform: "Android" });
  });

  it("gives frames inside a preview its identity and leaves the page and unnamed frames alone", () => {
    const nested = realm("mdv-preview-a", 3);
    run({ "mdv-preview-a": iphone }, nested);
    expect(nested.navigator.userAgent).toBe(iphone.userAgent);
    const other = realm("ad-frame");
    run({ "mdv-preview-a": iphone }, other);
    expect(other.navigator.userAgent).toBe("Desktop Chrome");
    const page = realm("mdv-preview-a");
    page.context.window.top = page.context.window;
    run({ "mdv-preview-a": iphone }, page);
    expect(page.navigator.userAgent).toBe("Desktop Chrome");
    const hidden = realm("mdv-preview-a", 2, true);
    run({ "mdv-preview-a": iphone }, hidden);
    expect(hidden.navigator.userAgent).toBe("Desktop Chrome");
  });

  it("does not take a frame named after an object property for a preview", () => {
    const frame = realm("constructor");
    run({ "mdv-preview-a": iphone }, frame);
    expect(frame.navigator.userAgent).toBe("Desktop Chrome");
  });
});

describe("a device's language and screen", () => {
  it("asks for the device's language and states its screen density, for any browser", () => {
    const headers = identityHeaders({ ...iphone, language: "de-DE", density: { dpr: 3, width: 402 } }, browser);
    expect(headers).toMatchObject({ "accept-language": "de-DE,de;q=0.9", "sec-ch-dpr": "3", "sec-ch-viewport-width": "402", "sec-ch-ua": null });
    expect(identityHeaders({ ...pixel, language: "ar" }, browser)["accept-language"]).toBe("ar");
    expect("accept-language" in identityHeaders(pixel, browser)).toBe(false);
    expect("sec-ch-dpr" in identityHeaders(pixel, browser)).toBe(false);
  });

  it("gives the page's scripts the device's language", () => {
    const frame = realm("mdv-preview-a");
    run({ "mdv-preview-a": { ...pixel, language: "pt-BR" } }, frame);
    expect(frame.navigator.language).toBe("pt-BR");
    expect(frame.navigator.languages).toEqual(["pt-BR", "pt"]);
  });
});

describe("the viewer's own Chrome", () => {
  it("reads brands and full versions, and falls back to plain Chromium", async () => {
    expect(await readBrowserBrands({ userAgent: "Chrome/141.0", userAgentData: { brands: browser.brands, getHighEntropyValues: async () => ({ fullVersionList: browser.fullVersionList, uaFullVersion: browser.uaFullVersion }) } })).toEqual(browser);
    expect(await readBrowserBrands({ userAgent: "Mozilla/5.0 Chrome/139.0.0.0" })).toEqual({
      brands: [{ brand: "Chromium", version: "139" }], fullVersionList: [{ brand: "Chromium", version: "139.0.0.0" }], uaFullVersion: "139.0.0.0",
    });
  });
});
