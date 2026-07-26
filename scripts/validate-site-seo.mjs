import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve("dist-site");
const sitemapPath = resolve(root, "sitemap.xml");
const robotsPath = resolve(root, "robots.txt");
const expectedOrigin = "https://edisonaugusthy.github.io";
const expectedPrefix = "/multi-device-viewer/";
const failures = [];

const requireFile = (path) => {
  if (!existsSync(path)) failures.push(`Missing build output: ${path}`);
};

const htmlAttribute = (html, tagPattern, attribute) => {
  const tag = html.match(tagPattern)?.[0] ?? "";
  return tag.match(new RegExp(`${attribute}="([^"]+)"`, "i"))?.[1] ?? "";
};

requireFile(sitemapPath);
requireFile(robotsPath);

let sitemapLocations = [];
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    failures.push("sitemap.xml must start with a UTF-8 XML declaration");
  }
  if (
    !sitemap.includes(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    )
  ) {
    failures.push("sitemap.xml is missing the sitemap protocol namespace");
  }

  sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, location]) => location,
  );
  if (sitemapLocations.length === 0) {
    failures.push("sitemap.xml contains no URLs");
  }
  if (new Set(sitemapLocations).size !== sitemapLocations.length) {
    failures.push("sitemap.xml contains duplicate URLs");
  }
}

const htmlPages = [];
for (const location of sitemapLocations) {
  const url = new URL(location);
  if (url.origin !== expectedOrigin || !url.pathname.startsWith(expectedPrefix)) {
    failures.push(`Sitemap URL is outside the canonical site: ${location}`);
    continue;
  }

  const relativePath = url.pathname.slice(expectedPrefix.length);
  const builtPath = relativePath
    ? resolve(root, relativePath)
    : resolve(root, "index.html");
  requireFile(builtPath);
  if (builtPath.endsWith(".html")) htmlPages.push({ location, builtPath });
}

if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, "utf8");
  const expectedSitemap = `${expectedOrigin}${expectedPrefix}sitemap.xml`;
  if (!robots.includes(`Sitemap: ${expectedSitemap}`)) {
    failures.push("robots.txt does not advertise the canonical sitemap URL");
  }
  if (/^Disallow:\s*\/\s*$/im.test(robots)) {
    failures.push("robots.txt blocks the complete site");
  }
}

const incomingInternalLinks = new Map(
  htmlPages.map(({ location }) => [location, 0]),
);

for (const { location, builtPath } of htmlPages) {
  if (!existsSync(builtPath)) continue;
  const page = relative(root, builtPath);
  const html = readFileSync(builtPath, "utf8");
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map(
    ([, title]) => title.replace(/\s+/g, " ").trim(),
  );
  const descriptions = [
    ...html.matchAll(/<meta\s+name="description"[\s\S]*?>/gi),
  ];
  const canonicals = [
    ...html.matchAll(/<link\s+rel="canonical"[\s\S]*?>/gi),
  ];
  const headings = [...html.matchAll(/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi)];

  if (titles.length !== 1) failures.push(`${page} must have exactly one title`);
  if (descriptions.length !== 1) {
    failures.push(`${page} must have exactly one meta description`);
  }
  if (canonicals.length !== 1) {
    failures.push(`${page} must have exactly one canonical link`);
  }
  if (headings.length !== 1) failures.push(`${page} must have exactly one H1`);
  if (/<meta\s+name="robots"[^>]*noindex/i.test(html)) {
    failures.push(`${page} is in the sitemap but marked noindex`);
  }

  const canonical = htmlAttribute(
    html,
    /<link\s+rel="canonical"[\s\S]*?>/i,
    "href",
  );
  if (canonical && canonical !== location) {
    failures.push(
      `${page} canonical does not match its sitemap URL: ${canonical}`,
    );
  }

  for (const [, href] of html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)) {
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const linked = new URL(href, location);
    if (incomingInternalLinks.has(linked.href)) {
      incomingInternalLinks.set(
        linked.href,
        (incomingInternalLinks.get(linked.href) ?? 0) + 1,
      );
    }
  }
}

for (const [location, incomingLinks] of incomingInternalLinks) {
  if (
    location !== `${expectedOrigin}${expectedPrefix}` &&
    incomingLinks === 0
  ) {
    failures.push(`Sitemap page has no incoming internal link: ${location}`);
  }
}

if (failures.length) {
  console.error("Site SEO validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Site SEO validation passed: ${htmlPages.length} sitemap pages are crawlable, canonical, and internally linked.`,
);
