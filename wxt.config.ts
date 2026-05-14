import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Multi Device Viewer",
    short_name: "Device Viewer",
    description:
      "Preview and compare websites across local device viewports with screenshots, annotations, and realistic mockups.",
    version: "0.1.1",
    permissions: ["activeTab", "debugger", "declarativeNetRequest", "declarativeNetRequestWithHostAccess", "downloads", "scripting", "storage", "tabs"],
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
      default_title: "Open Multi Device Viewer",
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
    ]
  },
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
