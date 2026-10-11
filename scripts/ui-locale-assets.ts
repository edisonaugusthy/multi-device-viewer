import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

// UI translations ship as separate files so each viewer downloads and parses
// only its own language. The catalogs in src stay the single source of truth.
export const UI_LOCALES_DIR = "ui-locales";
const catalogDir = fileURLToPath(new URL("../src/app/i18n-catalogs/", import.meta.url));

export function uiLocaleAssets() {
  return readdirSync(catalogDir)
    .filter(file => file.endsWith(".json"))
    .map(file => ({
      relativeDest: `${UI_LOCALES_DIR}/${file}`,
      contents: JSON.stringify(JSON.parse(readFileSync(catalogDir + file, "utf8"))),
    }));
}

// Serves the same files from Vite dev servers that are not built by WXT.
export function uiLocalesDevServer(): Plugin {
  return {
    name: "mdv-ui-locales",
    configureServer(server) {
      server.middlewares.use(`/${UI_LOCALES_DIR}/`, (request, response, next) => {
        const path = `${UI_LOCALES_DIR}${request.url?.split("?")[0] ?? ""}`;
        const asset = uiLocaleAssets().find(candidate => candidate.relativeDest === path);
        if (!asset) return next();
        response.setHeader("Content-Type", "application/json");
        response.end(asset.contents);
      });
    },
  };
}
