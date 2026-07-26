import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const source = pathToFileURL(
  resolve("store-assets/source/store-listing-assets.html"),
);
const outputDir = resolve("store-assets/webstore-upload");
const assets = [
  {
    key: "screenshot-01",
    width: 1280,
    height: 800,
    filename: "screenshot-01-overview.jpg",
  },
  {
    key: "screenshot-02",
    width: 1280,
    height: 800,
    filename: "screenshot-02-responsive-workspace.jpg",
  },
  {
    key: "screenshot-03",
    width: 1280,
    height: 800,
    filename: "screenshot-03-design-comparison.jpg",
  },
  {
    key: "promo-small",
    width: 440,
    height: 280,
    filename: "promo-small-440x280.jpg",
  },
  {
    key: "promo-marquee",
    width: 1400,
    height: 560,
    filename: "promo-marquee-1400x560.jpg",
  },
  {
    key: "og",
    width: 1200,
    height: 630,
    filename: "../../website/public/og.png",
    type: "png",
  },
];

const requestedKeys = new Set(process.argv.slice(2));
const selectedAssets = requestedKeys.size
  ? assets.filter(({ key }) => requestedKeys.has(key))
  : assets;
const unknownKeys = [...requestedKeys].filter(
  (key) => !assets.some((asset) => asset.key === key),
);

if (unknownKeys.length) {
  throw new Error(`Unknown asset key${unknownKeys.length > 1 ? "s" : ""}: ${unknownKeys.join(", ")}`);
}

const browser = await chromium.launch({ headless: true });

try {
  for (const asset of selectedAssets) {
    const page = await browser.newPage({
      viewport: { width: asset.width, height: asset.height },
      deviceScaleFactor: 1,
    });
    const url = new URL(source);
    url.searchParams.set("asset", asset.key);
    await page.goto(url.href, { waitUntil: "load" });
    await page.screenshot({
      path: resolve(outputDir, asset.filename),
      type: asset.type ?? "jpeg",
      quality: asset.type === "png" ? undefined : 94,
      fullPage: false,
    });
    await page.close();
    console.log(`${asset.filename}: ${asset.width}x${asset.height}`);
  }
} finally {
  await browser.close();
}
