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
    version: "0.1.0",
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
      const publicManifestIndexes = files
        .map((file, index) => ({ file, index }))
        .filter(({ file }) => file.relativeDest.split("/").at(-1) === "manifest.json")
        .map(({ index }) => index);

      for (const index of publicManifestIndexes.reverse()) {
        files.splice(index, 1);
      }
    }
  },
  zip: {
    exclude: ["mockups/manifest.json"]
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
