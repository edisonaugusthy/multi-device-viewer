// CI has no access to the private device frames. This writes plain stand-ins
// (a dark bezel around a transparent screen, with the real frame geometry) for
// any frame missing from internal/artwork/mockups/, so builds and browser
// tests can run. Real frames are never overwritten.
//
//   node scripts/stand-in-mockups.mjs
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const root = new URL("../", import.meta.url);
const output = new URL("internal/artwork/mockups/", root);
const source = await readFile(new URL("src/domain/device/device-art-frames.ts", root), "utf8");
const frames = JSON.parse(source.slice(source.indexOf("= [") + 2, source.lastIndexOf("]") + 1));

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

// An RGBA image: opaque bezel, transparent rounded screen. Browsers decode it
// by its content, so the .webp name used by the catalog still works.
function standIn({ width, height, renderScale, viewport }) {
  const screen = viewport[width > height ? "landscape" : "portrait"];
  const k = 1 / renderScale;
  const left = screen.left * k, top = screen.top * k, w = screen.width * k, h = screen.height * k;
  const r = Math.min((screen.cornerRadius ?? 0) * k, w / 2, h / 2);
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    for (let x = 0; x < width; x++) {
      const dx = Math.max(left + r - (x + 0.5), 0, x + 0.5 - (left + w - r));
      const dy = Math.max(top + r - (y + 0.5), 0, y + 0.5 - (top + h - r));
      const inside = x + 0.5 > left && x + 0.5 < left + w && y + 0.5 > top && y + 0.5 < top + h && dx * dx + dy * dy <= r * r;
      const p = row + 1 + x * 4;
      rows[p] = rows[p + 1] = rows[p + 2] = 24;
      rows[p + 3] = inside ? 0 : 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

await mkdir(output, { recursive: true });
let written = 0;
for (const frame of frames) {
  const target = new URL(`${frame.id}.webp`, output);
  if (existsSync(target)) continue;
  await writeFile(target, standIn(frame));
  written++;
}
console.log(`${written} stand-in frames written; ${frames.length - written} real frames kept.`);
