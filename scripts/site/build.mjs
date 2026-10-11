// Build the product website into dist-site/.
//   node scripts/site/build.mjs
// Renders every page from website/src templates into clean URLs (folder/index.html),
// hashes the CSS and JS, and writes the sitemap, robots.txt, 404 page and redirects
// from the old .html addresses.
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import * as esbuild from "esbuild";
import { site, url, abs, locales, defaultLocale } from "../../website/src/config.mjs";
import { translator, plain } from "../../website/src/render/html.mjs";
import { layout } from "../../website/src/render/layout.mjs";
import { homeBody } from "../../website/src/render/home.mjs";
import { parseContent, guideBody, guidesIndexBody, changelogBody, privacy, terms, notFoundBody } from "../../website/src/render/docs.mjs";
import { homeSchema, articleSchema, guidesIndexSchema, pageSchema } from "../../website/src/schema.mjs";
import { requirePrivateArtwork } from "../private-artwork.mjs";

const OUT = "dist-site";
const SRC = "website";
const today = new Date().toISOString().slice(0, 10);

const hash = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);
const gitDate = (...paths) => {
  try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...paths], { encoding: "utf8" }).trim() || today; }
  catch { return today; }
};
async function write(path, content) {
  const file = join(OUT, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

// ── assets ──────────────────────────────────────────────────────────────
await rm(OUT, { recursive: true, force: true });
await cp(join(SRC, "public"), OUT, { recursive: true });
await write("ARTWORK-LICENSE.txt", await readFile("ARTWORK-LICENSE.txt", "utf8"));
await write("LICENSE.txt", await readFile("LICENSE", "utf8"));

const css = (await esbuild.transform(await readFile(join(SRC, "src/styles/site.css"), "utf8"), { loader: "css", minify: true })).code;
const js = (await esbuild.build({ entryPoints: [join(SRC, "src/client/main.js")], bundle: true, minify: true, format: "esm", target: "es2020", write: false })).outputFiles[0].text;
const assets = { css: url(`assets/site-${hash(css)}.css`), js: url(`assets/main-${hash(js)}.js`) };
await write(assets.css.slice(site.base.length), css);
await write(assets.js.slice(site.base.length), js);

// ── data ────────────────────────────────────────────────────────────────
const store = existsSync(join(SRC, "public/data/store.json")) ? JSON.parse(await readFile(join(SRC, "public/data/store.json"), "utf8")) : null;
const english = JSON.parse(await readFile(join(SRC, "i18n/en.json"), "utf8"));
const messages = (locale) => {
  const file = join(SRC, `i18n/${locale.id}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
};

// Hero devices: frame art and screen geometry from the extension's own frame catalog,
// placed on a 1320 × 560 stage (MacBook raised behind; iPad, Duo, iPhone, Watch in front).
const frameSource = readFileSync("src/domain/device/device-art-frames.ts", "utf8");
const frameCatalog = JSON.parse(frameSource.slice(frameSource.indexOf("= [") + 2, frameSource.lastIndexOf("]") + 1));
const placement = [
  { id: "apple-macbook-pro-14-m5-2025", name: "MacBook Pro 14″", left: 250, bottom: 64, z: 1, width: 690, inset: 0 },
  { id: "apple-ipad-pro-11-2018", name: "iPad Pro 11″", left: 0, bottom: 0, z: 2, height: 420, inset: 24 },
  { id: "apple-iphone-duo-folded-2026", name: "iPhone Duo (folded)", left: 892, bottom: 0, z: 3, height: 300 },
  { id: "apple-iphone-18-pro-2026", name: "iPhone 18 Pro", left: 1092, bottom: 0, z: 4, height: 340 },
  { id: "apple-watch-series-12-46mm", name: "Apple Watch Series 12", left: 1240, bottom: 0, z: 5, height: 160, inset: 10 },
];
for (const { id } of placement) {
  await write(`frames/${id}.webp`, await readFile(await requirePrivateArtwork(`mockups/${id}.webp`)));
}
// Same path as src/domain/device/screen-path.ts: a rounded screen opening.
// Cameras need no hole; the frame image paints them above the page.
const r2 = (v) => Math.round(v * 100) / 100;
const roundedScreenPath = (w, h, radius) => {
  const r = r2(Math.max(0, Math.min(radius, w / 2, h / 2)));
  const arc = (x, y) => (r ? `A${r} ${r} 0 0 1 ${r2(x)} ${r2(y)}` : "");
  return `M${r} 0H${r2(w - r)}${arc(w, r)}V${r2(h - r)}${arc(w - r, h)}H${r}${arc(0, h - r)}V${r}${arc(r, 0)}Z`;
};
const devices = placement.map((p) => {
  const art = frameCatalog.find((f) => f.id === p.id);
  if (!art) throw new Error(`Missing device frame ${p.id}`);
  const orientation = Object.keys(art.viewport)[0];
  const vp = art.viewport[orientation];
  const frameW = +(art.width * art.renderScale).toFixed(2);
  const frameH = +(art.height * art.renderScale).toFixed(2);
  const scale = p.width ? p.width / frameW : p.height / frameH;
  const path = vp.paths?.[orientation] ?? roundedScreenPath(vp.width, vp.height, vp.cornerRadius ?? 0);
  // Keep the demo page clear of the island, camera or status area.
  const lowest = Math.max(0, ...(vp.occlusions ?? []).map((o) => o.top + o.height));
  return {
    ...p,
    frameW, frameH,
    scale: +scale.toFixed(5),
    width: +(frameW * scale).toFixed(1),
    height: +(frameH * scale).toFixed(1),
    inset: p.inset ?? Math.round(lowest + 8),
    screen: { left: vp.left, top: vp.top, width: vp.width, height: vp.height, clip: `path(evenodd, "${path}")` },
  };
});

const guides = await Promise.all(
  JSON.parse((await readFile(join(SRC, "content/guides-index.html"), "utf8")).match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1]).order
    .map(async (slug) => parseContent(await readFile(join(SRC, `content/guides/${slug}.html`), "utf8"))),
);
const guidesIndex = parseContent(await readFile(join(SRC, "content/guides-index.html"), "utf8"));
const changelog = parseContent(await readFile(join(SRC, "content/changelog.html"), "utf8"));

// ── pages ───────────────────────────────────────────────────────────────
const sitemap = [];
const en = translator(english, english);
const homeAlternates = [
  ...locales.filter((l) => messages(l)).map((l) => ({ hreflang: l.hreflang, href: abs(l.path) })),
  { hreflang: "x-default", href: abs("") },
];
const homeLastmod = gitDate("website/src", "website/i18n");
// Screenshots shown on every homepage, listed in the image sitemap.
const homeImages = () => [
  ["workspace-1280"], ["sync-1280"], ["all-devices-1920"], ["design-compare-1280"], ["fix-prompt-1280"],
].map(([file]) => ({ loc: abs(`screenshots/${file}.webp`) }));

for (const locale of locales) {
  const own = messages(locale);
  if (!own) { console.warn(`Skipping ${locale.id}: no translation file`); continue; }
  const t = translator(own, english);
  const html = layout({
    locale, t, home: true,
    path: locale.path,
    title: plain(t("meta.title")),
    description: plain(t("meta.description")),
    ogTitle: plain(t("meta.ogTitle")),
    ogImageAlt: plain(t("meta.ogImageAlt")),
    alternates: homeAlternates,
    jsonLd: homeSchema({ t, locale, store }),
    body: homeBody({ t, locale, store, devices }),
  }, assets);
  await write(locale.path + "index.html", html);
  sitemap.push({ path: locale.path, lastmod: homeLastmod, alternates: homeAlternates, images: homeImages() });
}

const englishPage = async (path, { title, description, body, jsonLd, current, ogType, lastmod, robots, file }) => {
  const html = layout({ locale: defaultLocale, t: en, path, title, description, body, jsonLd, current, ogType, robots }, assets);
  await write(file ?? path + "index.html", html);
  if (!robots) sitemap.push({ path, lastmod });
};

await englishPage(privacy.path, { title: privacy.title, description: privacy.description, body: privacy.body(), current: "privacy", lastmod: privacy.updated,
  jsonLd: pageSchema({ path: privacy.path, title: privacy.title, description: privacy.description, name: "Privacy policy", updated: privacy.updated }) });
await englishPage(terms.path, { title: terms.title, description: terms.description, body: terms.body(), lastmod: terms.updated > today ? today : terms.updated,
  jsonLd: pageSchema({ path: terms.path, title: terms.title, description: terms.description, name: "Terms of use", updated: terms.updated }) });
await englishPage("changelog/", { title: changelog.meta.title, description: changelog.meta.description, body: changelogBody(changelog), lastmod: gitDate("website/content/changelog.html"),
  jsonLd: pageSchema({ path: "changelog/", title: changelog.meta.title, description: changelog.meta.description, name: "Changelog" }) });
await englishPage("guides/", { title: guidesIndex.meta.title, description: guidesIndex.meta.description, body: guidesIndexBody(guidesIndex, guides), current: "guides",
  lastmod: gitDate("website/content"), jsonLd: guidesIndexSchema(guidesIndex.meta, guides) });
for (const guide of guides) {
  await englishPage(`guides/${guide.meta.slug}/`, { title: guide.meta.title, description: guide.meta.description, body: guideBody(guide, guides), current: "guides", ogType: "article",
    lastmod: guide.meta.dateModified, jsonLd: articleSchema(guide.meta) });
}
// GitHub Pages serves 404.html for any missing path, so its links are absolute.
await englishPage("404.html", { title: "Page not found | Mobile View", description: "This page has moved or never existed.", body: notFoundBody(), robots: "noindex", file: "404.html" });

// Old .html addresses keep working and pass their signals to the clean URLs.
const redirects = {
  "index.html": "", "privacy.html": "privacy/", "changelog.html": "changelog/",
  ...Object.fromEntries(guides.map((g) => [`guides/${g.meta.slug}.html`, `guides/${g.meta.slug}/`])),
};
for (const [from, to] of Object.entries(redirects)) {
  if (from === "index.html") continue; // the homepage itself is index.html
  await write(from, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${abs(to)}"><meta http-equiv="refresh" content="0; url=${url(to)}"><meta name="robots" content="noindex"></head><body><p>This page moved to <a href="${url(to)}">${abs(to)}</a>.</p></body></html>\n`);
}

// ── sitemap, robots, manifest ───────────────────────────────────────────
// Google ignores <priority> and <changefreq>; <lastmod> is the date the page content last changed.
const xmlText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemap.map((entry) => [
  "  <url>",
  `    <loc>${xmlText(abs(entry.path))}</loc>`,
  `    <lastmod>${entry.lastmod}</lastmod>`,
  ...(entry.alternates ?? []).map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlText(a.href)}"/>`),
  ...(entry.images ?? []).map((image) => `    <image:image><image:loc>${xmlText(image.loc)}</image:loc></image:image>`),
  "  </url>",
].join("\n")).join("\n")}
</urlset>
`);
await write("robots.txt", `User-agent: *
Allow: /

# LLM-readable product summary
# ${abs("llms.txt")}

Sitemap: ${abs("sitemap.xml")}
`);
await write("site.webmanifest", JSON.stringify({
  name: site.fullName, short_name: site.name, start_url: url(), scope: url(), display: "browser",
  background_color: "#F7F7F4", theme_color: "#F7F7F4",
  icons: [{ src: url("icons/icon-128.png"), sizes: "128x128", type: "image/png" }],
}, null, 2) + "\n");

// llms.txt: absolute URLs follow the configured origin and base.
const llms = (await readFile(join(SRC, "llms.txt"), "utf8")).replaceAll("{{site}}", abs("").replace(/\/$/, "")).replaceAll("{{store}}", site.storeUrl).replaceAll("{{repo}}", site.repo);
await write("llms.txt", llms);

const pages = (await readdir(OUT, { recursive: true })).filter((f) => f.endsWith(".html")).length;
console.log(`Built ${sitemap.length} indexable pages (${pages} HTML files) into ${OUT}/ with ${locales.filter(messages).length} homepage languages.`);
