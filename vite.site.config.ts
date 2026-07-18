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
      responsiveGuide: resolve(__dirname, "website/guides/responsive-testing.html"),
    } },
  },
});
