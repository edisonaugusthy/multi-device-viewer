import type { Size } from "./device.types";

/** Logical screen sizes are independent of artwork and of the visible browser viewport. */
export const displayReferences: Record<string, { screen: Size; panel: Size; dpr: number; source: string }> = {
  "apple-iphone-14-pro-2022": { screen: { width: 393, height: 852 }, panel: { width: 1179, height: 2556 }, dpr: 3, source: "https://support.apple.com/en-gb/111849" },
  "apple-iphone-14-pro-max-2022": { screen: { width: 430, height: 932 }, panel: { width: 1290, height: 2796 }, dpr: 3, source: "https://support.apple.com/en-us/111846" },
  "apple-iphone-17-pro-2025": { screen: { width: 402, height: 874 }, panel: { width: 1206, height: 2622 }, dpr: 3, source: "https://support.apple.com/en-mide/125090" },
  "apple-ipad-mini-6": { screen: { width: 744, height: 1133 }, panel: { width: 1488, height: 2266 }, dpr: 2, source: "https://support.apple.com/en-us/111886" },
  // This model downscales its rendered screen. Do not divide its panel by DPR.
  // Native Safari / Display Zoom calibration remains in the device checklist.
  "apple-iphone-12-mini": { screen: { width: 375, height: 812 }, panel: { width: 1080, height: 2340 }, dpr: 3, source: "https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json" },
};
