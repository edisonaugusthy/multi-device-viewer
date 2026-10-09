// Geist is packaged locally (public/fonts, SIL OFL 1.1). Fonts declared inside a
// shadow stylesheet are ignored, so the viewer registers them on the document's
// FontFaceSet, which shadow roots share.
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const CYRILLIC = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116";
const VIETNAMESE = "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB";

const SUBSETS = [
  ["latin", LATIN],
  ["latin-ext", LATIN_EXT],
  ["cyrillic", CYRILLIC],
  ["vietnamese", VIETNAMESE],
] as const;

const FAMILIES = [
  ["Geist", "geist"],
  ["Geist Mono", "geist-mono"],
] as const;

let registered = false;

export function registerViewerFonts(resolveUrl: (path: string) => string) {
  if (registered || typeof FontFace === "undefined" || !document.fonts) return;
  registered = true;
  for (const [family, file] of FAMILIES) {
    for (const [subset, unicodeRange] of SUBSETS) {
      const face = new FontFace(family, `url("${resolveUrl(`fonts/${file}-${subset}-wght-normal.woff2`)}") format("woff2")`, {
        style: "normal",
        weight: "100 900",
        display: "swap",
        unicodeRange,
      });
      document.fonts.add(face);
      void face.load().catch(() => document.fonts.delete(face));
    }
  }
}
