// Refresh the public Chrome Web Store numbers shown on the website.
// Writes website/public/data/store.json. On any failure the previous file is kept,
// so a flaky fetch never blanks the rating or reviews on the live site.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { site } from "../../website/src/config.mjs";

const OUT = "website/public/data/store.json";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const cookies = new Map();

const decode = (s) => s
  .replace(/<[^>]+>/g, "")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();

async function request(url, init = {}) {
  for (let hop = 0; hop < 8; hop++) {
    const res = await fetch(url, {
      ...init,
      redirect: "manual",
      headers: {
        "user-agent": UA,
        "accept-language": "en-US,en;q=0.9",
        cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(init.headers ?? {}),
      },
    });
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const at = pair.indexOf("=");
      if (at > 0) cookies.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim());
    }
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url).href;
      init = { headers: init.headers };
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return { url, html: await res.text() };
  }
  throw new Error("Too many redirects");
}

// In the EU Google first shows a cookie-consent page. Submit its "Reject all"
// form (essential cookies only), then continue to the listing.
async function getPage(url) {
  let page = await request(url);
  if (new URL(page.url).hostname === "consent.google.com") {
    const forms = [...page.html.matchAll(/<form action="(https:\/\/consent\.google\.com\/save)"[\s\S]*?<\/form>/g)];
    const reject = forms.find(([form]) => /name="set_eom" value="true"/.test(form));
    if (!reject) throw new Error("Consent page without a reject option");
    const body = new URLSearchParams();
    for (const [, name, value] of reject[0].matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)"/g)) body.append(name, decode(value));
    await request(reject[1], { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: body.toString() });
    page = await request(url);
  }
  return page.html;
}

// "2,000" → 2000, "1.2K" → 1200, "3M" → 3000000.
function count(match) {
  if (!match) return null;
  const raw = match[1].replace(/\s/g, "");
  const unit = raw.match(/[KM]$/)?.[0];
  const n = unit ? Number(raw.slice(0, -1).replace(",", ".")) * (unit === "K" ? 1e3 : 1e6) : Number(raw.replace(/[,.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseListing(html) {
  // The listing's own rating is the first "N out of 5" before the ratings count.
  const rating = Number(html.match(/(\d(?:\.\d)?) out of 5 stars/)?.[1]);
  const ratingCount = count(html.match(/([\d,.]+\s*[KM]?)\s+ratings?\b/));
  const users = count(html.match(/([\d,.]+\s*[KM]?)\+?\s+users\b/));
  const version = decode(html.match(/Version<\/div>\s*<div[^>]*>([^<]+)</)?.[1] ?? "");
  const updated = decode(html.match(/Updated<\/div>\s*<div[^>]*>([^<]+)</)?.[1] ?? "");
  return {
    rating: Number.isFinite(rating) && rating > 0 ? rating : null,
    ratingCount: Number.isFinite(ratingCount) ? ratingCount : null,
    users: Number.isFinite(users) ? users : null,
    version: version || null,
    updated: updated ? new Date(updated + " UTC").toISOString().slice(0, 10) : null,
  };
}

function parseReviews(html) {
  const reviews = [];
  for (const [, section] of html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)) {
    const stars = section.match(/aria-label="(\d) out of 5 stars/);
    const name = section.match(/<h3[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>/);
    if (!stars || !name) continue;
    const paragraphs = [...section.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)].map(([, p]) => decode(p)).filter(Boolean);
    // The reviewer's words come first; a developer reply, when present, follows.
    const text = paragraphs[0] ?? "";
    const date = section.match(/([A-Z][a-z]{2} \d{1,2}, \d{4})/)?.[1];
    const helpful = Number(section.match(/(\d+) (?:person|people) found this review/)?.[1] ?? 0);
    reviews.push({
      author: decode(name[1]),
      rating: Number(stars[1]),
      date: date ? new Date(date + " UTC").toISOString().slice(0, 10) : null,
      text,
      helpful,
    });
  }
  return reviews;
}

async function main() {
  let previous = null;
  try { previous = JSON.parse(await readFile(OUT, "utf8")); } catch {}
  try {
    const listing = parseListing(await getPage(`${site.storeUrl}?hl=en`));
    if (listing.rating === null || listing.ratingCount === null) throw new Error("Rating not found on the listing page");
    const reviews = parseReviews(await getPage(`${site.reviewsUrl}?hl=en`));
    const data = { fetchedAt: new Date().toISOString(), source: site.storeUrl, ...listing, reviews };
    await mkdir(dirname(OUT), { recursive: true });
    await writeFile(OUT, JSON.stringify(data, null, 2) + "\n");
    console.log(`Store data: ${data.rating} from ${data.ratingCount} ratings, ${data.users} users, ${reviews.length} reviews.`);
  } catch (error) {
    console.warn(`Could not refresh store data (${error.message}).${previous ? " Keeping the previous file." : ""}`);
    if (!previous) process.exitCode = 1;
  }
}

await main();
