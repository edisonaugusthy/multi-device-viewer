import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "website"),
  publicDir: resolve(__dirname, "website/public"),
  base: "/multi-device-viewer/",
  build: {
    outDir: resolve(__dirname, "dist-site"),
    emptyOutDir: true,
    rollupOptions: { input: {
      home: resolve(__dirname, "website/index.html"),
      privacy: resolve(__dirname, "website/privacy.html"),
      changelog: resolve(__dirname, "website/changelog.html"),
      guides: resolve(__dirname, "website/guides/index.html"),
      responsiveGuide: resolve(__dirname, "website/guides/responsive-testing.html"),
      mobileViewGuide: resolve(__dirname, "website/guides/mobile-view-device-emulator.html"),
      responsiveCheckerGuide: resolve(__dirname, "website/guides/responsive-design-checker.html"),
      responsiveWebsiteTestingGuide: resolve(__dirname, "website/guides/responsive-website-testing.html"),
      chromeMobileViewGuide: resolve(__dirname, "website/guides/chrome-mobile-view-extension.html"),
      firefoxMobileViewGuide: resolve(__dirname, "website/guides/firefox-mobile-view.html"),
      viewportSizesGuide: resolve(__dirname, "website/guides/device-viewport-sizes.html"),
    } },
  },
});
