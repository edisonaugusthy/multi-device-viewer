import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const sizes = [16, 32, 48, 128];
const outDir = join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

const palette = {
  backgroundTop: [10, 43, 69, 255],
  backgroundBottom: [8, 137, 120, 255],
  backgroundGlow: [88, 214, 184, 90],
  deviceShadow: [3, 10, 18, 92],
  desktop: [224, 251, 246, 255],
  tablet: [255, 255, 255, 248],
  phone: [19, 30, 44, 255],
  phoneScreen: [87, 201, 236, 255],
  accent: [255, 212, 102, 255],
  highlight: [255, 255, 255, 120],
  rail: [237, 253, 250, 255]
};

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

function mix(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * t));
}

function blendPixel(pixels, size, x, y, color, alphaScale = 1) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  const sourceAlpha = (color[3] / 255) * alphaScale;
  const targetAlpha = pixels[index + 3] / 255;
  const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);

  if (outAlpha <= 0) return;

  pixels[index] = Math.round((color[0] * sourceAlpha + pixels[index] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  pixels[index + 1] = Math.round((color[1] * sourceAlpha + pixels[index + 1] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  pixels[index + 2] = Math.round((color[2] * sourceAlpha + pixels[index + 2] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  pixels[index + 3] = Math.round(outAlpha * 255);
}

function coverageRoundedRect(px, py, x, y, w, h, radius) {
  const innerX = Math.max(x + radius, Math.min(px, x + w - radius));
  const innerY = Math.max(y + radius, Math.min(py, y + h - radius));
  const dx = px - innerX;
  const dy = py - innerY;
  return dx * dx + dy * dy <= radius * radius ? 1 : 0;
}

function drawRoundedRect(pixels, size, x, y, w, h, radius, color) {
  const scale = 3;
  const samples = scale * scale;
  const minX = Math.floor(x);
  const maxX = Math.ceil(x + w);
  const minY = Math.floor(y);
  const maxY = Math.ceil(y + h);

  for (let py = minY; py < maxY; py += 1) {
    for (let px = minX; px < maxX; px += 1) {
      let covered = 0;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          covered += coverageRoundedRect(px + (sx + 0.5) / scale, py + (sy + 0.5) / scale, x, y, w, h, radius);
        }
      }
      if (covered > 0) blendPixel(pixels, size, px, py, color, covered / samples);
    }
  }
}

function drawCircle(pixels, size, cx, cy, radius, color) {
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= radius * radius) blendPixel(pixels, size, x, y, color);
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, color, thickness) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    drawCircle(pixels, size, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, thickness / 2, color);
  }
}

function createPng(size) {
  const pixels = Buffer.alloc(size * size * 4, 0);
  const scale = size / 128;

  for (let y = 0; y < size; y += 1) {
    const t = y / Math.max(1, size - 1);
    const base = mix(palette.backgroundTop, palette.backgroundBottom, t);
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      pixels[index] = base[0];
      pixels[index + 1] = base[1];
      pixels[index + 2] = base[2];
      pixels[index + 3] = 255;
    }
  }

  drawCircle(pixels, size, 86 * scale, 31 * scale, 38 * scale, palette.backgroundGlow);
  drawRoundedRect(pixels, size, 0, 0, size, size, 27 * scale, [0, 0, 0, 0]);

  drawRoundedRect(pixels, size, 22 * scale, 68 * scale, 86 * scale, 12 * scale, 6 * scale, palette.deviceShadow);
  drawRoundedRect(pixels, size, 13 * scale, 37 * scale, 66 * scale, 48 * scale, 10 * scale, palette.desktop);
  drawRoundedRect(pixels, size, 19 * scale, 43 * scale, 54 * scale, 31 * scale, 5 * scale, [10, 37, 56, 255]);
  drawRoundedRect(pixels, size, 36 * scale, 80 * scale, 20 * scale, 8 * scale, 2 * scale, palette.rail);
  drawRoundedRect(pixels, size, 24 * scale, 88 * scale, 45 * scale, 7 * scale, 4 * scale, palette.rail);

  drawRoundedRect(pixels, size, 50 * scale, 23 * scale, 48 * scale, 67 * scale, 12 * scale, palette.tablet);
  drawRoundedRect(pixels, size, 57 * scale, 32 * scale, 34 * scale, 47 * scale, 5 * scale, [15, 23, 42, 255]);
  drawRoundedRect(pixels, size, 62 * scale, 37 * scale, 24 * scale, 9 * scale, 3 * scale, [63, 210, 187, 255]);
  drawRoundedRect(pixels, size, 62 * scale, 51 * scale, 24 * scale, 20 * scale, 3 * scale, palette.phoneScreen);

  drawRoundedRect(pixels, size, 82 * scale, 54 * scale, 27 * scale, 51 * scale, 8 * scale, palette.phone);
  drawRoundedRect(pixels, size, 87 * scale, 62 * scale, 17 * scale, 32 * scale, 3 * scale, [228, 252, 248, 255]);
  drawCircle(pixels, size, 95.5 * scale, 99 * scale, 2.1 * scale, [148, 163, 184, 255]);

  drawLine(pixels, size, 77 * scale, 105 * scale, 109 * scale, 105 * scale, palette.accent, 5 * scale);
  drawLine(pixels, size, 103 * scale, 97 * scale, 111 * scale, 105 * scale, palette.accent, 5 * scale);
  drawLine(pixels, size, 103 * scale, 113 * scale, 111 * scale, 105 * scale, palette.accent, 5 * scale);
  drawLine(pixels, size, 17 * scale, 20 * scale, 46 * scale, 20 * scale, palette.highlight, 3 * scale);

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
