// Validate the built site in dist-site/ for search engines:
// sitemap ↔ files, canonicals, hreflang reciprocity, one H1, titles and descriptions,
// valid JSON-LD, clean internal links that resolve, image alt text, orphans,
// robots.txt, the 404 page and redirects from the old .html addresses.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { site, abs, locales } from "../website/src/config.mjs";

const root = "dist-site";
const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);

const fileFor = (location) => {
  const url = new URL(location);
  if (url.origin !== site.origin || !url.pathname.startsWith(site.base)) return null;
  const rel = decodeURIComponent(url.pathname.slice(site.base.length));
  return join(root, rel === "" || rel.endsWith("/") ? rel + "index.html" : rel);
};
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
const alternatesOf = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(([, hreflang, href]) => ({ hreflang, href }));
// Search Console verification and the social/meta tags every page must carry.
const GOOGLE_VERIFICATION = "htTwPty3Iq08Xc3GtR8nX_t78rbN5BL1MX1WuAU8Zmc";
const requiredTags = [
  `<meta name="google-site-verification" content="${GOOGLE_VERIFICATION}">`,
  '<meta name="viewport"', '<meta name="theme-color"', '<link rel="icon"',
  'property="og:title"', 'property="og:description"', 'property="og:image"', 'property="og:url"', 'property="og:type"', 'property="og:locale"',
  'name="twitter:card"', 'name="twitter:title"', 'name="twitter:description"', 'name="twitter:image"',
];
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// ── sitemap and robots ──────────────────────────────────────────────────
const sitemapPath = join(root, "sitemap.xml");
if (!existsSync(sitemapPath)) fail("Missing sitemap.xml");
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, "utf8") : "";
if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) fail("sitemap.xml must start with a UTF-8 XML declaration");
if (!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) fail("sitemap.xml is missing the sitemap namespace");
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
  loc: decode(body.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ""),
  lastmod: body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
  alternates: [...body.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map(([, hreflang, href]) => ({ hreflang, href: decode(href) })),
  images: [...body.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(([, loc]) => decode(loc)),
}));

const locations = new Set(entries.map((e) => e.loc));
if (locations.size !== entries.length) fail("sitemap.xml contains duplicate URLs");

// Well-formed XML (xmllint ships with macOS and the Ubuntu runners).
try { execFileSync("xmllint", ["--noout", sitemapPath], { stdio: "pipe" }); }
catch (error) { if (error.code !== "ENOENT") fail(`sitemap.xml is not well-formed XML: ${String(error.stderr ?? error.message).trim()}`); }

// hreflang groups in the sitemap: valid codes, one x-default, every member lists the same set.
const today = new Date().toISOString().slice(0, 10);
const groupKey = (alternates) => alternates.map((a) => `${a.hreflang}=${a.href}`).sort().join("|");
const hreflangPattern = /^(x-default|[a-z]{2,3}(-[A-Za-z]{2}|-\d{3}|-[A-Z][a-z]{3})?)$/;
for (const e of entries) {
  if (e.lastmod && e.lastmod > today) fail(`Sitemap lastmod is in the future: ${e.loc} (${e.lastmod})`);
  for (const image of e.images) { const file = fileFor(image); if (!file || !existsSync(file)) fail(`Sitemap image does not exist: ${image}`); }
  if (!e.alternates.length) continue;
  if (!e.alternates.some((a) => a.href === e.loc)) fail(`Sitemap hreflang group of ${e.loc} does not include itself`);
  if (e.alternates.filter((a) => a.hreflang === "x-default").length !== 1) fail(`Sitemap hreflang group of ${e.loc} needs exactly one x-default`);
  if (new Set(e.alternates.map((a) => a.hreflang)).size !== e.alternates.length) fail(`Sitemap hreflang group of ${e.loc} repeats a language`);
  for (const a of e.alternates) {
    if (!hreflangPattern.test(a.hreflang)) fail(`Invalid hreflang code "${a.hreflang}" in ${e.loc}`);
    const member = entries.find((other) => other.loc === a.href);
    if (!member) fail(`hreflang target is not in the sitemap: ${a.href}`);
    else if (groupKey(member.alternates) !== groupKey(e.alternates)) fail(`hreflang is not reciprocal between ${e.loc} and ${a.href}`);
  }
}

// Every indexable page that was built must be in the sitemap.
for (const file of readdirSync(root, { recursive: true }).filter((f) => f.endsWith("index.html"))) {
  const html = readFileSync(join(root, file), "utf8");
  if (/<meta name="robots"[^>]*noindex/.test(html) || /http-equiv="refresh"/.test(html)) continue;
  const location = abs(file.replace(/index\.html$/, ""));
  if (!locations.has(location)) fail(`Built page missing from the sitemap: ${location}`);
}
if (!entries.length) fail("sitemap.xml contains no URLs");
for (const e of entries) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod ?? "")) fail(`Sitemap entry without a valid lastmod: ${e.loc}`);
  if (/\.html$/.test(e.loc)) fail(`Sitemap URL is not a clean URL: ${e.loc}`);
  const file = fileFor(e.loc);
  if (!file) fail(`Sitemap URL is outside the site: ${e.loc}`);
  else if (!existsSync(file)) fail(`Sitemap URL has no built page: ${e.loc}`);
}

const robots = existsSync(join(root, "robots.txt")) ? readFileSync(join(root, "robots.txt"), "utf8") : "";
if (!robots.includes(`Sitemap: ${abs("sitemap.xml")}`)) fail("robots.txt does not advertise the sitemap");
if (/^Disallow:\s*\/\s*$/im.test(robots)) fail("robots.txt blocks the whole site");

// ── pages ───────────────────────────────────────────────────────────────
const incoming = new Map([...locations].map((l) => [l, 0]));
const titles = new Map();
const homeLocations = new Set(locales.map((l) => abs(l.path)));

for (const entry of entries) {
  const file = fileFor(entry.loc);
  if (!file || !existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const page = entry.loc.replace(abs(), "/");
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
  const description = attr(html.match(/<meta name="description"[^>]*>/)?.[0] ?? "", "content") ?? "";
  const canonical = attr(html.match(/<link rel="canonical"[^>]*>/)?.[0] ?? "", "href");

  if ((html.match(/<title>/g) ?? []).length !== 1 || !title) fail(`${page}: needs exactly one <title>`);
  if (!description) fail(`${page}: missing meta description`);
  if ([...decode(title)].length > 70) warnings.push(`${page}: title is ${[...decode(title)].length} characters`);
  if ([...decode(description)].length > 170) warnings.push(`${page}: description is ${[...decode(description)].length} characters`);
  if (canonical !== entry.loc) fail(`${page}: canonical ${canonical} does not match ${entry.loc}`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`${page}: needs exactly one <h1>`);
  if (!/<html lang="[^"]+"/.test(html)) fail(`${page}: missing <html lang>`);
  if (/<meta name="robots"[^>]*noindex/.test(html)) fail(`${page}: in the sitemap but noindex`);
  for (const tag of requiredTags) if (!html.includes(tag)) fail(`${page}: missing ${tag}`);
  if (titles.has(title)) fail(`${page}: duplicate title with ${titles.get(title)}`);
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  const self = alternatesOf(html).find((a) => a.href === entry.loc);
  if (self && lang && self.hreflang !== lang && !(lang === "fil" && self.hreflang === "tl")) fail(`${page}: <html lang="${lang}"> does not match its hreflang ${self.hreflang}`);
  titles.set(title, page);

  // Structured data must parse and carry a @context.
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { if (!JSON.parse(json)["@context"]) fail(`${page}: JSON-LD without @context`); }
    catch (error) { fail(`${page}: invalid JSON-LD (${error.message})`); }
  }
  if (!html.includes("application/ld+json")) fail(`${page}: no structured data`);

  // hreflang: homepages list every language plus x-default, and the sitemap agrees.
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(([, hreflang, href]) => ({ hreflang, href }));
  if (homeLocations.has(entry.loc)) {
    if (!alternates.some((a) => a.href === entry.loc)) fail(`${page}: hreflang set does not include itself`);
    if (!alternates.some((a) => a.hreflang === "x-default")) fail(`${page}: missing x-default hreflang`);
    for (const a of alternates) if (!locations.has(a.href)) fail(`${page}: hreflang ${a.hreflang} points outside the sitemap: ${a.href}`);
    if (alternates.length !== entry.alternates.length) fail(`${page}: page and sitemap hreflang sets differ`);
  }

  // Images need alt text (empty alt for decoration is fine).
  for (const [tag] of html.matchAll(/<img\s[^>]*>/g)) if (attr(tag, "alt") === undefined) fail(`${page}: image without alt: ${tag.slice(0, 80)}`);

  // Internal links: clean, resolvable, and counted for orphan detection.
  for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#)/.test(href)) {
      if (href.includes("chromewebstore.google.com") && /[?&](authuser|hl)=/.test(href)) fail(`${page}: store link with tracking parameters: ${href}`);
      continue;
    }
    const target = new URL(href, entry.loc);
    target.hash = "";
    if (/\.html$/.test(target.pathname)) fail(`${page}: internal link to an .html address: ${href}`);
    const targetFile = fileFor(target.href);
    if (!targetFile || !existsSync(targetFile)) fail(`${page}: broken internal link: ${href}`);
    if (incoming.has(target.href) && target.href !== entry.loc) incoming.set(target.href, incoming.get(target.href) + 1);
  }
}

for (const [location, count] of incoming) if (location !== abs() && count === 0) fail(`Orphan page (no internal links): ${location}`);

// ── 404 and legacy redirects ────────────────────────────────────────────
const notFound = existsSync(join(root, "404.html")) ? readFileSync(join(root, "404.html"), "utf8") : "";
if (!notFound) fail("Missing 404.html");
else {
  if (!/noindex/.test(notFound)) fail("404.html must be noindex");
  if (!notFound.includes(requiredTags[0])) fail("404.html is missing the google-site-verification tag");
}
for (const legacy of ["privacy.html", "changelog.html", "guides/responsive-testing.html", "guides/device-viewport-sizes.html"]) {
  const file = join(root, legacy);
  if (!existsSync(file) || !/http-equiv="refresh"/.test(readFileSync(file, "utf8"))) fail(`Missing redirect for the old address ${legacy}`);
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (failures.length) {
  console.error("Site SEO validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Site SEO validation passed: ${entries.length} pages, ${homeLocations.size} languages, clean URLs, canonicals, hreflang and structured data all consistent.`);
