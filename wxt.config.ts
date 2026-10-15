import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { UI_LOCALES_DIR, uiLocaleAssets } from "./scripts/ui-locale-assets";
import { mockupAssets } from "./scripts/mockup-assets";

export default defineConfig({
  manifestVersion: 3,
  targetBrowsers: ["chrome"],
  modules: ["@wxt-dev/module-react"],
  webExt: {
    // Preserve development cookies and sessions between dev-server restarts.
    chromiumArgs: [
      `--user-data-dir=${fileURLToPath(new URL("./.wxt/chrome-data", import.meta.url))}`,
    ],
  },
  manifest: {
    default_locale: "en",
    name: "__MSG_extensionName__",
    short_name: "__MSG_extensionShortName__",
    description: "__MSG_extensionDescription__",
    version: "0.3.1",
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    permissions: [
      "activeTab",
      "contextMenus",
      "declarativeNetRequestWithHostAccess",
      "downloads",
      "scripting",
      "storage",
      "offscreen",
      "tabCapture",
    ],
    host_permissions: ["http://*/*", "https://*/*"],
    icons: {
      16: "/icons/icon-16.png",
      32: "/icons/icon-32.png",
      48: "/icons/icon-48.png",
      128: "/icons/icon-128.png"
    },
    action: {
      default_title: "__MSG_actionTitle__",
      default_icon: {
        16: "/icons/icon-16.png",
        32: "/icons/icon-32.png",
        48: "/icons/icon-48.png",
        128: "/icons/icon-128.png"
      }
    },
    web_accessible_resources: [
      {
        // viewer.js and its shared chunks are loaded by the content script on demand.
        resources: ["viewer.js", "chunks/*", "mockups/*", "icons/*", "fonts/*", `${UI_LOCALES_DIR}/*`],
        matches: ["http://*/*", "https://*/*"]
      }
    ],
  },
  hooks: {
    "vite:build:extendConfig": (entrypoints, config) => {
      // Build the in-page viewer with the simulator page, so both share one copy
      // of React and the app instead of the content script bundling its own.
      if (!entrypoints.some((entry) => entry.name === "simulator")) return;
      const rollup = (config.build ??= {}).rollupOptions ??= {};
      rollup.input = { ...(rollup.input as Record<string, string>), viewer: fileURLToPath(new URL("./src/app/viewer-mount.ts", import.meta.url)) };
      rollup.preserveEntrySignatures = "exports-only";
    },
    "build:publicAssets": (_, files) => {
      // UI translations ship as per-language files (see scripts/ui-locale-assets.ts).
      files.push(...uiLocaleAssets());
      files.push(...mockupAssets());
      for (const name of ["LICENSE", "ARTWORK-LICENSE.txt"]) {
        files.push({
          relativeDest: name === "LICENSE" ? "LICENSE.txt" : name,
          contents: readFileSync(new URL(`./${name}`, import.meta.url), "utf8"),
        });
      }
    }
  },
  vite: () => ({
    define: { __MDV_OPEN_SHADOW_QA__: JSON.stringify(process.env.MDV_OPEN_SHADOW_QA === "1") },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@/": fileURLToPath(new URL("./src/", import.meta.url))
      }
    }
  })
});
