import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const sizes = [16, 32, 48, 128];
const outDir = join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function drawRoundedRect(pixels, size, x, y, w, h, radius, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      const dx = Math.max(x - px + radius, 0, px - (x + w - radius - 1));
      const dy = Math.max(y - py + radius, 0, py - (y + h - radius - 1));
      if (dx * dx + dy * dy <= radius * radius) setPixel(pixels, size, px, py, color);
    }
  }
}

function setPixel(pixels, size, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
}

function drawLine(pixels, size, x1, y1, x2, y2, color, thickness) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    drawRoundedRect(pixels, size, x - thickness, y - thickness, thickness * 2 + 1, thickness * 2 + 1, thickness, color);
  }
}

function createPng(size) {
  const pixels = Buffer.alloc(size * size * 4, 0);
  const scale = size / 128;

  drawRoundedRect(pixels, size, 0, 0, size, size, Math.round(28 * scale), [15, 118, 110, 255]);
  drawRoundedRect(pixels, size, Math.round(20 * scale), Math.round(24 * scale), Math.round(52 * scale), Math.round(66 * scale), Math.round(10 * scale), [204, 251, 241, 255]);
  drawRoundedRect(pixels, size, Math.round(44 * scale), Math.round(16 * scale), Math.round(58 * scale), Math.round(78 * scale), Math.round(12 * scale), [255, 255, 255, 242]);
  drawRoundedRect(pixels, size, Math.round(54 * scale), Math.round(30 * scale), Math.round(36 * scale), Math.round(48 * scale), Math.round(5 * scale), [17, 24, 39, 255]);
  drawLine(pixels, size, Math.round(22 * scale), Math.round(102 * scale), Math.round(98 * scale), Math.round(102 * scale), [255, 255, 255, 255], Math.max(1, Math.round(4 * scale)));
  drawLine(pixels, size, Math.round(86 * scale), Math.round(88 * scale), Math.round(108 * scale), Math.round(110 * scale), [125, 211, 252, 255], Math.max(1, Math.round(3 * scale)));
  drawLine(pixels, size, Math.round(108 * scale), Math.round(110 * scale), Math.round(108 * scale), Math.round(92 * scale), [125, 211, 252, 255], Math.max(1, Math.round(3 * scale)));
  drawLine(pixels, size, Math.round(108 * scale), Math.round(110 * scale), Math.round(90 * scale), Math.round(110 * scale), [125, 211, 252, 255], Math.max(1, Math.round(3 * scale)));

  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    scanlines[y * (size * 4 + 1)] = 0;
    pixels.copy(scanlines, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of sizes) {
  writeFileSync(join(outDir, `icon-${size}.png`), createPng(size));
}
