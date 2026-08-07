import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";

const uploadDirectory = resolve("store-assets/webstore-upload");
const iconPath = resolve("public/icons/icon-128.png");

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error("Expected a PNG image.");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Expected a JPEG image.");
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }

  throw new Error("JPEG dimensions could not be read.");
}

async function dimensions(path) {
  const buffer = await readFile(path);
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return pngDimensions(buffer);
  if (extension === ".jpg" || extension === ".jpeg") return jpegDimensions(buffer);
  throw new Error(`Unsupported Store image type: ${extension}`);
}

async function expectDimensions(path, expectedWidth, expectedHeight) {
  const actual = await dimensions(path);
  if (actual.width !== expectedWidth || actual.height !== expectedHeight) {
    throw new Error(
      `${path} must be ${expectedWidth}x${expectedHeight}; found ${actual.width}x${actual.height}.`,
    );
  }
}

const files = await readdir(uploadDirectory);
const screenshots = files.filter((file) => /^screenshot-.*\.(?:jpe?g|png)$/i.test(file));

if (screenshots.length < 1 || screenshots.length > 5) {
  throw new Error(`Chrome Web Store requires 1-5 screenshots; found ${screenshots.length}.`);
}

for (const screenshot of screenshots) {
  await expectDimensions(resolve(uploadDirectory, screenshot), 1280, 800);
}

await expectDimensions(resolve(uploadDirectory, "promo-small-440x280.jpg"), 440, 280);
await expectDimensions(resolve(uploadDirectory, "promo-marquee-1400x560.jpg"), 1400, 560);
await expectDimensions(iconPath, 128, 128);

console.log(
  `Chrome Web Store asset validation passed: ${screenshots.length} screenshots, small promo, marquee, and 128px icon.`,
);
