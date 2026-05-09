import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const outDir = join(process.cwd(), "public", "mockups");
const allowed = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const assets = readdirSync(outDir)
  .filter((file) => allowed.has(extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b))
  .map((file) => ({
    id: file.replace(/\.(png|jpg|jpeg|webp)$/i, ""),
    localPath: `/mockups/${file}`,
    file,
    bytes: statSync(join(outDir, file)).size
  }));

console.log(`Indexed ${assets.length} local mockups.`);
