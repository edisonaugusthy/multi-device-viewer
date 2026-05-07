import type { Device } from "./device.types";
import { getMockupAssets, localMockupCatalog } from "./mockup-catalog";

const curatedDevices: Device[] = [
  {
    id: "apple-iphone-air-2025",
    name: "Apple iPhone Air (2025)",
    brand: "Apple",
    family: "iPhone",
    year: 2025,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 430, height: 932 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1290, height: 2796 },
    mockupAssets: getMockupAssets("apple-iphone-air-2025"),
    updatedAt: "2025-10-22",
    tags: ["notch", "ios", "new"]
  },
  {
    id: "apple-iphone-17-pro-max-2025",
    name: "Apple iPhone 17 Pro Max (2025)",
    brand: "Apple",
    family: "iPhone",
    year: 2025,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 440, height: 956 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1320, height: 2868 },
    mockupAssets: getMockupAssets("apple-iphone-17-pro-max-2025"),
    updatedAt: "2025-10-22",
    tags: ["ios", "large"]
  },
  {
    id: "apple-iphone-16-pro-max-2024",
    name: "Apple iPhone 16 Pro Max (2024)",
    brand: "Apple",
    family: "iPhone",
    year: 2024,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 440, height: 956 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1320, height: 2868 },
    mockupAssets: getMockupAssets("apple-iphone-16-pro-max-2024"),
    updatedAt: "2024-11-02",
    tags: ["ios", "large"]
  },
  {
    id: "apple-iphone-15",
    name: "Apple iPhone 15",
    brand: "Apple",
    family: "iPhone",
    year: 2023,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 393, height: 852 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1179, height: 2556 },
    mockupAssets: getMockupAssets("apple-iphone-15"),
    updatedAt: "2024-11-02",
    tags: ["ios"]
  },
  {
    id: "apple-iphone-14",
    name: "Apple iPhone 14",
    brand: "Apple",
    family: "iPhone",
    year: 2022,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 390, height: 844 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1170, height: 2532 },
    mockupAssets: getMockupAssets("apple-iphone-14"),
    updatedAt: "2023-09-23",
    tags: ["ios"]
  },
  {
    id: "apple-iphone-13-mini",
    name: "Apple iPhone 13 Mini",
    brand: "Apple",
    family: "iPhone",
    year: 2021,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 375, height: 812 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1080, height: 2340 },
    mockupAssets: getMockupAssets("apple-iphone-13-mini"),
    updatedAt: "2022-02-10",
    tags: ["ios", "compact"]
  },
  {
    id: "apple-iphone-se-2018",
    name: "Apple iPhone SE (2018)",
    brand: "Apple",
    family: "iPhone",
    year: 2018,
    type: "phone",
    os: "iOS",
    cssViewport: { width: 320, height: 568 },
    pixelRatio: 2,
    manufacturerResolution: { width: 640, height: 1136 },
    mockupAssets: getMockupAssets("apple-iphone-se-2018"),
    updatedAt: "2022-01-12",
    tags: ["ios", "compact", "legacy"]
  },
  {
    id: "samsung-galaxy-s24",
    name: "Samsung Galaxy S24",
    brand: "Samsung",
    family: "Galaxy S",
    year: 2024,
    type: "phone",
    os: "Android",
    cssViewport: { width: 360, height: 780 },
    pixelRatio: 3,
    manufacturerResolution: { width: 1080, height: 2340 },
    mockupAssets: getMockupAssets("samsung-galaxy-s24"),
    updatedAt: "2025-02-20",
    tags: ["android"]
  },
  {
    id: "samsung-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    family: "Galaxy S",
    year: 2024,
    type: "phone",
    os: "Android",
    cssViewport: { width: 384, height: 824 },
    pixelRatio: 3.75,
    manufacturerResolution: { width: 1440, height: 3120 },
    mockupAssets: getMockupAssets("samsung-galaxy-s24-ultra"),
    updatedAt: "2025-02-20",
    tags: ["android", "large"]
  },
  {
    id: "google-pixel-8",
    name: "Google Pixel 8",
    brand: "Google",
    family: "Pixel",
    year: 2024,
    type: "phone",
    os: "Android",
    cssViewport: { width: 412, height: 915 },
    pixelRatio: 2.625,
    manufacturerResolution: { width: 1080, height: 2400 },
    mockupAssets: getMockupAssets("google-pixel-8"),
    updatedAt: "2025-02-20",
    tags: ["android"]
  },
  {
    id: "google-pixel-6-pro",
    name: "Google Pixel 6 Pro",
    brand: "Google",
    family: "Pixel",
    year: 2021,
    type: "phone",
    os: "Android",
    cssViewport: { width: 412, height: 892 },
    pixelRatio: 3.5,
    manufacturerResolution: { width: 1440, height: 3120 },
    mockupAssets: getMockupAssets("google-pixel-6-pro"),
    updatedAt: "2022-02-10",
    tags: ["android", "large"]
  },
  {
    id: "samsung-galaxy-z-fold-2",
    name: "Samsung Galaxy Z Fold 2",
    brand: "Samsung",
    family: "Galaxy Z",
    year: 2020,
    type: "phone",
    os: "Android",
    cssViewport: { width: 884, height: 1104 },
    pixelRatio: 2.5,
    manufacturerResolution: { width: 1768, height: 2208 },
    mockupAssets: getMockupAssets("samsung-galaxy-z-fold-2"),
    updatedAt: "2022-01-13",
    tags: ["android", "foldable"]
  },
  {
    id: "apple-ipad-mini-6",
    name: "Apple iPad Mini (6th Gen)",
    brand: "Apple",
    family: "iPad",
    year: 2021,
    type: "tablet",
    os: "iPadOS",
    cssViewport: { width: 744, height: 1133 },
    pixelRatio: 2,
    manufacturerResolution: { width: 1488, height: 2266 },
    mockupAssets: getMockupAssets("apple-ipad-mini-6"),
    updatedAt: "2022-01-02",
    tags: ["tablet", "ios"]
  },
  {
    id: "apple-ipad-air-4",
    name: "Apple iPad Air 4",
    brand: "Apple",
    family: "iPad",
    year: 2020,
    type: "tablet",
    os: "iPadOS",
    cssViewport: { width: 820, height: 1180 },
    pixelRatio: 2,
    manufacturerResolution: { width: 1640, height: 2360 },
    mockupAssets: getMockupAssets("apple-ipad-air-4"),
    updatedAt: "2022-03-16",
    tags: ["tablet", "ios"]
  },
  {
    id: "samsung-galaxy-tab-s7",
    name: "Samsung Galaxy Tab S7",
    brand: "Samsung",
    family: "Galaxy Tab",
    year: 2020,
    type: "tablet",
    os: "Android",
    cssViewport: { width: 800, height: 1280 },
    pixelRatio: 2,
    manufacturerResolution: { width: 1600, height: 2560 },
    mockupAssets: getMockupAssets("samsung-galaxy-tab-s7"),
    updatedAt: "2022-01-02",
    tags: ["tablet", "android"]
  },
  {
    id: "macbook-pro-16-2021",
    name: "Apple MacBook Pro 16 inch",
    brand: "Apple",
    family: "MacBook",
    year: 2021,
    type: "laptop",
    os: "macOS",
    cssViewport: { width: 1728, height: 1117 },
    pixelRatio: 2,
    manufacturerResolution: { width: 3456, height: 2234 },
    mockupAssets: getMockupAssets("macbook-pro-16-2021"),
    updatedAt: "2022-04-30",
    tags: ["desktop", "laptop"]
  },
  {
    id: "macbook-air-2020-13",
    name: "Apple MacBook Air 13 inch",
    brand: "Apple",
    family: "MacBook",
    year: 2020,
    type: "laptop",
    os: "macOS",
    cssViewport: { width: 1440, height: 900 },
    pixelRatio: 2,
    manufacturerResolution: { width: 2560, height: 1600 },
    mockupAssets: getMockupAssets("macbook-air-2020-13"),
    updatedAt: "2022-01-11",
    tags: ["desktop", "laptop"]
  },
  {
    id: "imac-24-2021",
    name: "iMac 24 inch",
    brand: "Apple",
    family: "iMac",
    year: 2021,
    type: "desktop",
    os: "macOS",
    cssViewport: { width: 2240, height: 1260 },
    pixelRatio: 2,
    manufacturerResolution: { width: 4480, height: 2520 },
    mockupAssets: getMockupAssets("imac-24-2021"),
    updatedAt: "2022-05-02",
    tags: ["desktop"]
  },
  {
    id: "apple-watch-series-6-40",
    name: "Apple Watch Series 6 (40mm)",
    brand: "Apple",
    family: "Watch",
    year: 2020,
    type: "watch",
    os: "watchOS",
    cssViewport: { width: 162, height: 197 },
    pixelRatio: 2,
    manufacturerResolution: { width: 324, height: 394 },
    mockupAssets: getMockupAssets("apple-watch-series-6-40"),
    updatedAt: "2022-01-13",
    tags: ["watch", "compact"]
  },
  {
    id: "samsung-neo-qled-4k-55",
    name: "Samsung Smart TV Neo QLED 4K 55 inch",
    brand: "Samsung",
    family: "Smart TV",
    year: 2021,
    type: "tv",
    os: "Tizen",
    cssViewport: { width: 1920, height: 1080 },
    pixelRatio: 2,
    manufacturerResolution: { width: 3840, height: 2160 },
    mockupAssets: getMockupAssets("samsung-neo-qled-4k-55"),
    updatedAt: "2022-01-02",
    tags: ["tv", "desktop"]
  }
];

export const devices: Device[] = [
  ...curatedDevices,
  ...createMockupOnlyDevices(curatedDevices)
];

export const defaultDeviceIds = [
  "apple-iphone-air-2025",
  "samsung-galaxy-s24",
  "apple-ipad-air-4"
];

function createMockupOnlyDevices(existing: Device[]): Device[] {
  const usedIds = new Set(existing.map((device) => device.id));
  const usedAssetPaths = new Set(existing.flatMap((device) => device.mockupAssets.map((asset) => asset.localPath).filter(Boolean)));

  return localMockupCatalog
    .filter((asset) => !usedIds.has(asset.id) && !usedAssetPaths.has(asset.localPath))
    .map((asset) => createDeviceFromMockup(asset.id));
}

function createDeviceFromMockup(id: string): Device {
  const type = deviceTypeFromId(id);
  const brand = brandFromId(id);
  const year = yearFromId(id);
  const os = osFromId(id, type, brand);
  const cssViewport = viewportFromId(id, type);
  const pixelRatio = type === "desktop" || type === "laptop" || type === "tv" ? 2 : type === "watch" ? 2 : 3;

  return {
    id,
    name: nameFromId(id),
    brand,
    family: familyFromId(id, brand, type),
    year,
    type,
    os,
    cssViewport,
    pixelRatio,
    manufacturerResolution: {
      width: Math.round(cssViewport.width * pixelRatio),
      height: Math.round(cssViewport.height * pixelRatio)
    },
    mockupAssets: getMockupAssets(id),
    updatedAt: "2026-05-07",
    tags: tagsFromId(id, type, os)
  };
}

function deviceTypeFromId(id: string): Device["type"] {
  if (id.includes("watch")) return "watch";
  if (id.includes("tv")) return "tv";
  if (id.includes("macbook") || id.includes("latitude")) return "laptop";
  if (id.includes("imac")) return "desktop";
  if (id.includes("ipad") || id.includes("tab") || id.includes("surface-duo")) return "tablet";
  return "phone";
}

function brandFromId(id: string) {
  if (id.startsWith("apple") || id.includes("macbook")) return "Apple";
  if (id.startsWith("samsung")) return "Samsung";
  if (id.startsWith("google")) return "Google";
  if (id.startsWith("xiaomi")) return "Xiaomi";
  if (id.startsWith("huawei")) return "Huawei";
  if (id.startsWith("oneplus")) return "OnePlus";
  if (id.startsWith("oppo")) return "OPPO";
  if (id.startsWith("microsoft")) return "Microsoft";
  if (id.startsWith("dell")) return "Dell";
  return "Generic";
}

function osFromId(id: string, type: Device["type"], brand: string) {
  if (type === "watch") return brand === "Apple" ? "watchOS" : "Wear OS";
  if (type === "tv") return brand === "Samsung" ? "Tizen" : "TV";
  if (type === "desktop" || type === "laptop") return brand === "Apple" ? "macOS" : "Desktop";
  if (id.includes("ipad")) return "iPadOS";
  if (brand === "Apple") return "iOS";
  return "Android";
}

function viewportFromId(id: string, type: Device["type"]) {
  if (type === "watch") return { width: 162, height: 197 };
  if (type === "tv") return { width: 1920, height: 1080 };
  if (type === "desktop") return { width: 2240, height: 1260 };
  if (type === "laptop") return id.includes("16") ? { width: 1728, height: 1117 } : { width: 1440, height: 900 };
  if (type === "tablet") {
    if (id.includes("surface-duo")) return { width: 540, height: 720 };
    if (id.includes("mini")) return { width: 744, height: 1133 };
    return { width: 820, height: 1180 };
  }
  if (id.includes("mini") || id.includes("iphone-5") || id.includes("iphone-se")) return { width: 375, height: 812 };
  if (id.includes("pro-max") || id.includes("ultra") || id.includes("plus")) return { width: 430, height: 932 };
  if (id.includes("fold")) return { width: 884, height: 1104 };
  if (id.includes("pixel")) return { width: 412, height: 892 };
  return { width: 390, height: 844 };
}

function familyFromId(id: string, brand: string, type: Device["type"]) {
  if (type === "watch") return "Watch";
  if (type === "tv") return "Smart TV";
  if (type === "tablet") return brand === "Apple" ? "iPad" : "Tablet";
  if (type === "desktop") return "Desktop";
  if (type === "laptop") return brand === "Apple" ? "MacBook" : "Laptop";
  if (brand === "Apple") return "iPhone";
  if (brand === "Samsung") return id.includes("fold") || id.includes("flip") ? "Galaxy Z" : "Galaxy";
  if (brand === "Google") return "Pixel";
  return "Phone";
}

function yearFromId(id: string) {
  const match = id.match(/20\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function tagsFromId(id: string, type: Device["type"], os: string) {
  return [type, os.toLowerCase(), ...(id.includes("fold") || id.includes("duo") ? ["foldable"] : [])];
}

function nameFromId(id: string) {
  const brand = brandFromId(id);
  const words = id
    .replace(/^apple-/, "")
    .replace(/^samsung-/, "")
    .replace(/^google-/, "")
    .replace(/^xiaomi-/, "")
    .replace(/^huawei-/, "")
    .replace(/^oneplus-/, "")
    .replace(/^oppo-/, "")
    .replace(/^microsoft-/, "")
    .replace(/^dell-/, "")
    .split("-")
    .filter((word) => !/^20\d{2}$/.test(word))
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");

  const formatted = words
    .replace(/\bIphone\b/g, "iPhone")
    .replace(/\bIpad\b/g, "iPad")
    .replace(/\bImac\b/g, "iMac")
    .replace(/\bMacbook\b/g, "MacBook");

  return brand === "Generic" ? formatted : `${brand} ${formatted}`;
}
