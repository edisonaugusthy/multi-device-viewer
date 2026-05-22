import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const sizes = [16, 32, 48, 128];
const outDir = join(process.cwd(), "public", "icons");
const source = join(process.cwd(), "store-assets", "icon-source", "multi-device-dashboard-icon-source.png");

if (!existsSync(source)) {
  throw new Error(`Icon source image not found: ${source}`);
}

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  execFileSync("sips", ["-z", String(size), String(size), source, "--out", join(outDir, `icon-${size}.png`)], {
    stdio: "inherit"
  });
}
