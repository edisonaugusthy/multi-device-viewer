import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const id = process.argv[2];
if (!/^[a-p]{32}$/.test(id ?? "")) throw new Error("Usage: node scripts/verify-live-store-locales.mjs CHROME_STORE_EXTENSION_ID");
const { locales } = JSON.parse(await readFile("store-assets/listings/locales.json", "utf8"));
const normalize = value => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const collect = value => typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(collect) : value && typeof value === "object" ? Object.values(value).flatMap(collect) : [];
const pending = [...locales], results = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (pending.length) {
    const expected = pending.shift();
    const url = `https://chromewebstore.google.com/detail/${id}?hl=${encodeURIComponent(expected.storeLocale)}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const strings = [];
      for (const match of html.matchAll(/AF_initDataCallback\(\{[\s\S]*?data:([\s\S]*?),\s*sideChannel:/g)) {
        try { strings.push(...collect(JSON.parse(match[1]))); } catch { /* A changed page format is reported below. */ }
      }
      if (!strings.length) throw new Error("Store response format not recognized; inspect manually.");
      const normalized = new Set(strings.map(normalize));
      results.push({ locale: expected.locale, url, nameMatches: normalized.has(normalize(expected.name)), summaryMatches: normalized.has(normalize(expected.summary)), descriptionMatches: normalized.has(normalize(expected.description)), responseHash: createHash("sha256").update(html).digest("hex") });
    } catch (error) { results.push({ locale: expected.locale, url, error: String(error) }); }
  }
}));
results.sort((a,b) => a.locale.localeCompare(b.locale));
await mkdir("output/store-audit", { recursive: true });
const path = "output/store-audit/live-locales.json";
await writeFile(path, JSON.stringify({ checkedAt: new Date().toISOString(), id, results }, null, 2) + "\n");
const passed = results.filter(r => r.nameMatches && r.summaryMatches && r.descriptionMatches).length;
console.log(`${passed}/${locales.length} live listings match. Evidence: ${path}`);
if (passed !== locales.length) process.exitCode = 1;
