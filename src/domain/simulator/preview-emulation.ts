import type { IdentityPlatform, PreviewIdentity } from "./preview-identity";

/** The Chrome running the viewer, whose brands and version a Chrome identity keeps. */
export interface BrowserBrands {
  brands: Brand[];
  fullVersionList: Brand[];
  uaFullVersion: string;
}
export interface Brand { brand: string; version: string }

/** Every client hint a Chrome may send about itself. */
const CLIENT_HINTS = ["sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform", "sec-ch-ua-platform-version", "sec-ch-ua-model", "sec-ch-ua-arch", "sec-ch-ua-bitness", "sec-ch-ua-wow64", "sec-ch-ua-full-version", "sec-ch-ua-full-version-list", "sec-ch-ua-form-factors"];
const quoted = (value: string) => `"${value}"`;
const brandList = (brands: Brand[]) => brands.map(({ brand, version }) => `${quoted(brand)};v=${quoted(version)}`).join(", ");

/**
 * The request headers of the device's browser, by lower-case name; null
 * drops a header the viewer's Chrome would have sent. A browser without
 * client hints (Safari, a TV) sends none; a Chrome identity sends all of them,
 * high-entropy ones included, so a site sees the model, platform version
 * and form factor without first asking for them.
 */
export function identityHeaders(identity: PreviewIdentity, browser: BrowserBrands): Record<string, string | null> {
  const headers: Record<string, string | null> = { "user-agent": identity.userAgent, ...localeHeaders(identity) };
  for (const hint of CLIENT_HINTS) headers[hint] = null;
  if (!identity.hints) return headers;
  Object.assign(headers, {
    "sec-ch-ua": brandList(browser.brands),
    "sec-ch-ua-mobile": identity.mobile ? "?1" : "?0",
    "sec-ch-ua-platform": quoted(identity.platform),
  });
  const details = identity.details;
  if (!details) return headers;
  return Object.assign(headers, {
    "sec-ch-ua-platform-version": quoted(details.platformVersion),
    "sec-ch-ua-model": quoted(details.model),
    "sec-ch-ua-arch": quoted(details.architecture),
    "sec-ch-ua-bitness": quoted(details.bitness),
    "sec-ch-ua-wow64": "?0",
    "sec-ch-ua-full-version": quoted(browser.uaFullVersion),
    "sec-ch-ua-full-version-list": brandList(browser.fullVersionList),
    "sec-ch-ua-form-factors": quoted(details.formFactor),
  });
}

/** The device's language and screen, whatever browser it runs: they are this device's settings, not the browser's. */
function localeHeaders(identity: PreviewIdentity): Record<string, string> {
  const headers: Record<string, string> = {};
  if (identity.language) {
    const base = identity.language.split("-")[0];
    headers["accept-language"] = base === identity.language ? identity.language : `${identity.language},${base};q=0.9`;
  }
  if (identity.density) {
    headers["sec-ch-dpr"] = String(identity.density.dpr);
    headers["sec-ch-viewport-width"] = String(identity.density.width);
  }
  return headers;
}

const NAVIGATOR_PLATFORM: Record<IdentityPlatform, string> = {
  iOS: "iPhone", macOS: "MacIntel", Android: "Linux armv81", Windows: "Win32", "Chrome OS": "Linux x86_64", Linux: "Linux x86_64",
};

/** What a preview's scripts read from navigator. A browser without client hints has no userAgentData. */
interface ScriptIdentity {
  userAgent: string;
  appVersion: string;
  platform: string;
  vendor: string;
  maxTouchPoints: number;
  languages?: string[];
  userAgentData?: { brands: Brand[]; mobile: boolean; platform: string; highEntropy: Record<string, unknown> };
}

export function scriptIdentity(identity: PreviewIdentity, browser: BrowserBrands): ScriptIdentity {
  const { details } = identity;
  return {
    userAgent: identity.userAgent,
    appVersion: identity.userAgent.replace(/^Mozilla\//, ""),
    platform: NAVIGATOR_PLATFORM[identity.platform],
    vendor: identity.userAgent.includes("Chrome/") ? "Google Inc." : "Apple Computer, Inc.",
    maxTouchPoints: identity.touchPoints ?? 0,
    languages: identity.language ? [...new Set([identity.language, identity.language.split("-")[0]])] : undefined,
    userAgentData: identity.hints ? {
      brands: browser.brands, mobile: identity.mobile, platform: identity.platform,
      highEntropy: details ? {
        architecture: details.architecture, bitness: details.bitness, model: details.model, platformVersion: details.platformVersion,
        uaFullVersion: browser.uaFullVersion, fullVersionList: browser.fullVersionList, formFactors: [details.formFactor], wow64: false,
      } : {},
    } : undefined,
  };
}

/**
 * Runs in every frame of a debugged tab before the page's own scripts. A
 * preview frame, one directly under the page and named by the viewer, and
 * same-origin frames inside it read the device from navigator; the page
 * itself and every other frame keep the browser's own. Kept free of imports
 * and outer names, since it travels as source text.
 */
function installPreviewIdentity(identities: Record<string, ScriptIdentity>) {
  if (window === window.top) return;
  let name: string;
  try {
    let frame: Window = window;
    while (frame.parent !== window.top) frame = frame.parent;
    name = frame.name;
  } catch { return; }
  const identity = Object.prototype.hasOwnProperty.call(identities, name) ? identities[name] : undefined;
  if (!identity) return;
  const proto = Navigator.prototype;
  const define = (target: object, key: string, value: unknown) => {
    const get = Object.getOwnPropertyDescriptor({ get [key]() { return value; } }, key)!.get;
    Object.defineProperty(target, key, { get, configurable: true, enumerable: true });
  };
  define(proto, "userAgent", identity.userAgent);
  define(proto, "appVersion", identity.appVersion);
  define(proto, "platform", identity.platform);
  define(proto, "vendor", identity.vendor);
  define(proto, "maxTouchPoints", identity.maxTouchPoints);
  if (identity.languages) {
    define(proto, "language", identity.languages[0]);
    define(proto, "languages", Object.freeze(identity.languages.slice()));
  }
  const ua = identity.userAgentData;
  if (!ua) { delete (proto as { userAgentData?: unknown }).userAgentData; return; }
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  const low = () => ({ brands: copy(ua.brands), mobile: ua.mobile, platform: ua.platform });
  const UAData = (window as Window & { NavigatorUAData?: { prototype: object } }).NavigatorUAData;
  const data = Object.create(UAData ? UAData.prototype : Object.prototype);
  for (const key of ["brands", "mobile", "platform"] as const) define(data, key, key === "brands" ? Object.freeze(ua.brands.map(brand => Object.freeze({ ...brand }))) : ua[key]);
  Object.defineProperty(data, "getHighEntropyValues", { configurable: true, writable: true, value: function getHighEntropyValues(hints: string[]) {
    const values: Record<string, unknown> = low();
    for (const hint of Array.isArray(hints) ? hints : []) if (hint in ua.highEntropy) values[hint] = copy(ua.highEntropy[hint]);
    return Promise.resolve(values);
  } });
  Object.defineProperty(data, "toJSON", { configurable: true, writable: true, value: function toJSON() { return low(); } });
  define(proto, "userAgentData", data);
}

/** The source that gives each named preview frame its identity in navigator. */
export function identityScript(identities: Record<string, PreviewIdentity>, browser: BrowserBrands): string {
  const scripts = Object.fromEntries(Object.entries(identities).map(([name, identity]) => [name, scriptIdentity(identity, browser)]));
  return `(${installPreviewIdentity.toString()})(${JSON.stringify(scripts)});`;
}

/** The viewer's own Chrome, read where the extension runs; a browser that does not say gets plain Chromium brands. */
export async function readBrowserBrands(navigatorLike: { userAgent: string; userAgentData?: { brands: Brand[]; getHighEntropyValues?(hints: string[]): Promise<{ fullVersionList?: Brand[]; uaFullVersion?: string }> } }): Promise<BrowserBrands> {
  const major = /Chrome\/(\d+)/.exec(navigatorLike.userAgent)?.[1] ?? "140";
  const data = navigatorLike.userAgentData;
  const brands = data?.brands?.length ? data.brands : [{ brand: "Chromium", version: major }];
  const high = await data?.getHighEntropyValues?.(["fullVersionList", "uaFullVersion"]).catch(() => undefined);
  return {
    brands,
    fullVersionList: high?.fullVersionList?.length ? high.fullVersionList : brands.map(({ brand, version }) => ({ brand, version: `${version}.0.0.0` })),
    uaFullVersion: high?.uaFullVersion ?? `${major}.0.0.0`,
  };
}
