import { createReadStream, createWriteStream, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { PNG } from "pngjs";

const mockupDir = join(process.cwd(), "public", "mockups");

function isCheckerPixel(r, g, b) {
  const light = Math.abs(r - 255) <= 3 && Math.abs(g - 255) <= 3 && Math.abs(b - 255) <= 3;
  const mid = Math.abs(r - 238) <= 4 && Math.abs(g - 238) <= 4 && Math.abs(b - 238) <= 4;
  return light || mid;
}

function cleanFile(file) {
  return new Promise((resolve, reject) => {
    const fullPath = join(mockupDir, file);
    createReadStream(fullPath)
      .pipe(new PNG())
      .on("parsed", function handleParsed() {
        for (let y = 0; y < this.height; y += 1) {
          for (let x = 0; x < this.width; x += 1) {
            const index = (this.width * y + x) << 2;
            const r = this.data[index];
            const g = this.data[index + 1];
            const b = this.data[index + 2];
            if (isCheckerPixel(r, g, b)) {
              this.data[index + 3] = 0;
            }
          }
        }

        this.pack().pipe(createWriteStream(fullPath)).on("finish", resolve).on("error", reject);
      })
      .on("error", reject);
  });
}

const files = readdirSync(mockupDir).filter((file) => extname(file).toLowerCase() === ".png");

for (const file of files) {
  await cleanFile(file);
}

console.log(`Cleaned checkerboard transparency in ${files.length} PNG mockups.`);
