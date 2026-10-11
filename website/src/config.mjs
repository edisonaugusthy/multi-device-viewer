// Site-wide settings. Move to a custom domain by setting SITE_ORIGIN and SITE_BASE
// (for example SITE_ORIGIN=https://mobileview.dev SITE_BASE=/) — every URL,
// canonical, hreflang and sitemap entry follows from these two values.
import { readFileSync } from "node:fs";

const storeId = "jfcnekmenjickfihkniaoaklehjmdhdb";
const storeUrl = `https://chromewebstore.google.com/detail/${storeId}`;
const base = (process.env.SITE_BASE ?? "/multi-device-viewer/").replace(/\/?$/, "/");

export const site = {
  origin: (process.env.SITE_ORIGIN ?? "https://edisonaugusthy.github.io").replace(/\/$/, ""),
  base,
  name: "Mobile View",
  fullName: "Mobile View: Device Emulator & Responsive Tester",
  author: "Edison Augusthy",
  authorUrl: "https://github.com/edisonaugusthy",
  repo: "https://github.com/edisonaugusthy/multi-device-viewer",
  issues: "https://github.com/edisonaugusthy/multi-device-viewer/issues",
  license: "https://opensource.org/license/mit",
  storeId,
  storeUrl,
  reviewsUrl: `${storeUrl}/reviews`,
  version: JSON.parse(readFileSync("package.json", "utf8")).version,
  // Matches the "All devices" count in the extension's device library.
  deviceCount: 111,
};

/** Path inside the site, e.g. url("privacy/") → "/multi-device-viewer/privacy/". */
export const url = (path = "") => site.base + path.replace(/^\//, "");
/** Absolute URL for canonicals, sitemaps and structured data. */
export const abs = (path = "") => site.origin + url(path);

// Homepage languages: every Chrome Web Store listing language. English lives at
// the root; the others at /<code>/. Native names come from the store listings.
const listings = JSON.parse(readFileSync("store-assets/listings/locales.json", "utf8")).locales;
const nativeName = Object.fromEntries(listings.map((l) => [l.locale, l.language]));
const rtl = new Set(["ar", "fa", "he"]);
const extensionLocales = [
  "am", "ar", "bg", "bn", "ca", "cs", "da", "de", "el", "es", "es_419", "et", "fa", "fi", "fil", "fr", "gu",
  "he", "hi", "hr", "hu", "id", "it", "ja", "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl", "no", "pl",
  "pt_BR", "pt_PT", "ro", "ru", "sk", "sl", "sr", "sv", "sw", "ta", "te", "th", "tr", "uk", "vi", "zh_CN", "zh_TW",
];

const toLocale = (id) => {
  const lang = id.replace("_", "-");
  return {
    id,
    path: id === "en" ? "" : `${lang.toLowerCase()}/`,
    lang,
    // Google expects ISO 639-1 in hreflang; Filipino maps to Tagalog (tl).
    hreflang: id === "fil" ? "tl" : lang,
    dir: rtl.has(id) ? "rtl" : "ltr",
    name: id === "en" ? "English" : nativeName[id] ?? id,
  };
};

export const locales = ["en", ...extensionLocales].map(toLocale);
export const defaultLocale = locales[0];
