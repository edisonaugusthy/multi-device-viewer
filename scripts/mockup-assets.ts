import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { Plugin } from "vite";

const directory = fileURLToPath(new URL("../internal/artwork/mockups/", import.meta.url));
const catalog = fileURLToPath(new URL("../src/domain/device/device-art-frames.ts", import.meta.url));

// Only catalogued raster exports enter the build, never other internal files.
export function mockupAssets() {
  const source = readFileSync(catalog, "utf8");
  const frames = JSON.parse(source.slice(source.indexOf("= [") + 2, source.lastIndexOf("]") + 1)) as { id: string }[];
  return frames.map(({ id }) => {
    const file = `${id}.webp`;
    if (!/^[a-z0-9-]+\.webp$/.test(file)) throw new Error(`Invalid mockup filename: ${file}`);
    const absoluteSrc = join(directory, file);
    if (!existsSync(absoluteSrc)) {
      throw new Error(`Missing private mockup: ${file}. Restore internal/artwork/mockups/ before building or running previews.`);
    }
    return { relativeDest: `mockups/${file}`, absoluteSrc };
  });
}

// Keep /mockups URLs stable in the standalone preview without public copies.
export function mockupsPreviewPlugin(): Plugin {
  return {
    name: "mdv-private-mockups",
    configureServer(server) {
      const assets = new Map(mockupAssets().map((asset) => [`/${asset.relativeDest}`, asset.absoluteSrc]));
      server.middlewares.use((request, response, next) => {
        const source = assets.get(request.url?.split("?")[0] ?? "");
        if (!source) return next();
        response.setHeader("Content-Type", "image/webp");
        response.end(readFileSync(source));
      });
    },
    generateBundle() {
      for (const asset of mockupAssets()) {
        this.emitFile({ type: "asset", fileName: asset.relativeDest, source: readFileSync(asset.absoluteSrc) });
      }
    },
  };
}
