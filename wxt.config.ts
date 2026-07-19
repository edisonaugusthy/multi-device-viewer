import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  manifestVersion: 3,
  targetBrowsers: ["chrome", "firefox"],
  modules: ["@wxt-dev/module-react"],
  manifest: ({ browser }) => ({
    default_locale: "en",
    name: "__MSG_extensionName__",
    short_name: "__MSG_extensionShortName__",
    description: "__MSG_extensionDescription__",
    version: "0.2.0",
    permissions: [
      "contextMenus",
      "declarativeNetRequest",
      "downloads",
      "scripting",
      "storage",
      "tabs",
      ...(browser === "firefox" ? [] : ["offscreen", "tabCapture"]),
    ],
    declarative_net_request: {
      rule_resources: [
        {
          id: "frame-headers",
          enabled: true,
          path: "rules/frame-headers.json"
        }
      ]
    },
    host_permissions: ["<all_urls>"],
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
        resources: ["mockups/*", "icons/*", "simulator.html", "chunks/*", "assets/*"],
        matches: ["<all_urls>"]
      }
    ],
    browser_specific_settings: browser === "firefox" ? {
      gecko: {
        id: "multi-device-viewer@edisonaugusthy.dev",
        strict_min_version: "140.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
      gecko_android: {
        strict_min_version: "142.0",
      },
    } : undefined,
  }),
  hooks: {
    "build:publicAssets": (_, files) => {
      // Prevent any manifest.json nested inside a subdirectory of public/ from
      // being copied into the output. The Chrome Web Store rejects packages that
      // contain more than one manifest.json (e.g. public/mockups/manifest.json).
      const nestedManifestIndexes = files
        .map((file, index) => ({ file, index }))
        .filter(({ file }) => {
          const parts = file.relativeDest.split("/");
          return parts.length > 1 && parts.at(-1) === "manifest.json";
        })
        .map(({ index }) => index);

      for (const index of nestedManifestIndexes.reverse()) {
        files.splice(index, 1);
      }
    }
  },
  zip: {
    // Belt-and-suspenders: also exclude from the zip in case the file
    // somehow makes it into the output directory through another path.
    exclude: ["**/manifest.json", "!manifest.json"],
    // Keep generated website/preview bundles out of Mozilla's source archive.
    // Tailwind scans files below the source root, so including these outputs
    // changes the rebuilt extension even when the authored sources are equal.
    excludeSources: ["dist/**", "dist-site/**"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@/": fileURLToPath(new URL("./src/", import.meta.url))
      }
    }
  })
});
