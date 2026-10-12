import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { CELL_SIZE, createPixelDiffer, MAX_REGIONS, MAX_THRESHOLD } from "./pixel-diff";

let diff: ReturnType<typeof createPixelDiffer>;
beforeAll(async () => {
  const bytes = await readFile(new URL("../../../public/wasm/pixel-diff.wasm", import.meta.url));
  const { instance } = await WebAssembly.instantiate(bytes);
  diff = createPixelDiffer(instance);
});
const pixels = (...values: number[]) => new Uint8ClampedArray(values);
const blank = (width: number, height: number) => new Uint8ClampedArray(width * height * 4).fill(255);
function paint(image: Uint8ClampedArray, width: number, x: number, y: number, w: number, h: number, color = [0, 0, 0, 255]) {
  for (let row = y; row < y + h; row++) for (let column = x; column < x + w; column++) image.set(color, (row * width + column) * 4);
  return image;
}
const bit = (mask: Uint8Array, cell: number) => (mask[cell >> 3] >> (cell & 7)) & 1;
const EXACT = 0, NORMAL = 10, LOOSE = 30;

/** pixelmatch's perceptual colour difference, in double precision. */
function colorDelta(a: Uint8ClampedArray, b: Uint8ClampedArray, pixel: number) {
  const blend = (data: Uint8ClampedArray, channel: number) => 255 + (data[pixel + channel] - 255) * (data[pixel + 3] / 255);
  const yiq = (data: Uint8ClampedArray) => {
    const r = blend(data, 0), g = blend(data, 1), bl = blend(data, 2);
    return [r * 0.29889531 + g * 0.58662247 + bl * 0.11448223, r * 0.59597799 - g * 0.27417610 - bl * 0.32180189, r * 0.21147017 - g * 0.52261711 + bl * 0.31114694];
  };
  const [y1, i1, q1] = yiq(a), [y2, i2, q2] = yiq(b);
  return 0.5053 * (y1 - y2) ** 2 + 0.299 * (i1 - i2) ** 2 + 0.1957 * (q1 - q2) ** 2;
}
const maxDelta = (threshold: number) => Math.round(35215 * (threshold / MAX_THRESHOLD) ** 2);

describe("the packaged WASM pixel comparison", () => {
  it("counts changed pixels exactly", () => {
    const result = diff(pixels(0, 0, 0, 255, 10, 20, 30, 255), pixels(0, 0, 0, 255, 200, 20, 30, 255), 2, 1, NORMAL);
    expect(result.changedPixels).toBe(1);
    expect(result.totalPixels).toBe(2);
  });
  it("uses a perceptual colour difference: faint shifts and invisible RGB do not count", () => {
    // Grey 10 → 26 is below Normal; blue is far harder to see than green.
    expect(diff(pixels(10, 10, 10, 255), pixels(26, 26, 26, 255), 1, 1, NORMAL).changedPixels).toBe(0);
    expect(diff(pixels(10, 10, 10, 255), pixels(26, 26, 26, 255), 1, 1, EXACT).changedPixels).toBe(1);
    expect(diff(pixels(0, 0, 0, 255), pixels(0, 0, 60, 255), 1, 1, NORMAL).changedPixels).toBe(0);
    expect(diff(pixels(0, 0, 0, 255), pixels(0, 60, 0, 255), 1, 1, NORMAL).changedPixels).toBe(1);
    // Fully transparent pixels look white whatever their RGB.
    expect(diff(pixels(0, 0, 0, 0), pixels(255, 255, 255, 0), 1, 1, EXACT).changedPixels).toBe(0);
    expect(diff(pixels(0, 0, 0, 0), pixels(0, 0, 0, 255), 1, 1, EXACT).changedPixels).toBe(1);
  });
  it("matches pixelmatch's colour difference over mixed colors and alpha values", () => {
    const a = new Uint8ClampedArray(4096), b = new Uint8ClampedArray(4096);
    for (let i = 0; i < a.length; i++) { a[i] = (i * 37 + 19) % 256; b[i] = (i * 53 + 7) % 256; }
    for (const threshold of [EXACT, NORMAL, LOOSE, 60, MAX_THRESHOLD]) {
      let expected = 0, ambiguous = 0;
      for (let pixel = 0; pixel < a.length; pixel += 4) {
        const delta = colorDelta(a, b, pixel), limit = maxDelta(threshold);
        if (delta > limit) expected++;
        // Single-precision WASM may land on the other side of the limit when
        // the difference is within rounding of it.
        if (Math.abs(delta - limit) <= limit * 1e-5 + 1e-3) ambiguous++;
      }
      const result = diff(a, b, 32, 32, threshold);
      expect(Math.abs(result.changedPixels - expected), `threshold ${threshold}`).toBeLessThanOrEqual(ambiguous);
      if (threshold === EXACT) expect(result.changedPixels).toBe(expected);
    }
  });
  it("ignores anti-aliasing at Normal: a stroke that moved by a pixel", () => {
    const width = 24, height = 16;
    // A black vertical stroke with a grey anti-aliased edge, then the same
    // stroke one pixel to the right: every edge pixel differs.
    const before = paint(paint(blank(width, height), width, 10, 2, 1, 12), width, 11, 2, 1, 12, [128, 128, 128, 255]);
    const after = paint(paint(blank(width, height), width, 10, 2, 1, 12, [128, 128, 128, 255]), width, 11, 2, 1, 12);
    expect(diff(before, after, width, height, EXACT).changedPixels).toBe(24);
    expect(diff(before, after, width, height, NORMAL).changedPixels).toBe(0);
    expect(diff(before, after, width, height, NORMAL).regionCount).toBe(0);
  });
  it("keeps real small changes at Normal: a dot and a solid square", () => {
    const width = 40, height = 24;
    // Four cells apart, so they stay separate regions.
    const after = paint(paint(blank(width, height), width, 5, 5, 1, 1), width, 34, 12, 4, 4);
    const result = diff(blank(width, height), after, width, height, NORMAL);
    expect(result.changedPixels).toBe(17);
    expect(result.regions).toEqual([
      { x: 5, y: 5, width: 1, height: 1, pixels: 1 },
      { x: 34, y: 12, width: 4, height: 4, pixels: 16 },
    ]);
  });
  it("marks changed cells in a bit mask with exact pixel bounds, including partial edge cells", () => {
    const width = 20, height = 10; // 3 × 2 cells; the last column and row are partial
    const result = diff(blank(width, height), paint(blank(width, height), width, 17, 8, 3, 2), width, height, EXACT);
    expect([result.columns, result.rows, result.cellSize]).toEqual([3, 2, CELL_SIZE]);
    expect([0, 1, 2, 3, 4, 5].map(cell => bit(result.mask, cell))).toEqual([0, 0, 0, 0, 0, 1]);
    expect(result.regions).toEqual([{ x: 17, y: 8, width: 3, height: 2, pixels: 6 }]);
  });
  it("joins nearby changes into one region and keeps distant ones apart", () => {
    const width = 200, height = 120;
    const latest = blank(width, height);
    paint(latest, width, 10, 10, 8, 4);    // cells 1–2
    paint(latest, width, 34, 10, 8, 4);    // cells 4–5: one empty cell between, still one area
    paint(latest, width, 150, 90, 20, 20); // far away: its own area
    const result = diff(blank(width, height), latest, width, height, NORMAL);
    expect(result.changedPixels).toBe(8 * 4 * 2 + 400);
    expect(result.regionCount).toBe(2);
    expect(result.regions).toEqual([
      { x: 10, y: 10, width: 32, height: 4, pixels: 64 },
      { x: 150, y: 90, width: 20, height: 20, pixels: 400 },
    ]);
    // Three empty cells apart is too far to join.
    paint(latest, width, 66, 10, 2, 2);
    expect(diff(blank(width, height), latest, width, height, NORMAL).regionCount).toBe(3);
  });
  it("reports the largest regions top to bottom and counts the rest", () => {
    const width = 1024, height = 64;
    const latest = blank(width, height);
    for (let index = 0; index < 30; index++) paint(latest, width, index * 32, (index % 2) * 40, 1 + (index % 5), 1);
    const result = diff(blank(width, height), latest, width, height, EXACT);
    expect(result.regionCount).toBe(30);
    expect(result.regions).toHaveLength(MAX_REGIONS);
    const ys = result.regions.map(region => region.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(Math.min(...result.regions.map(region => region.pixels))).toBeGreaterThanOrEqual(2);
  });
  it("returns no regions for identical images", () => {
    const image = paint(blank(64, 64), 64, 3, 3, 9, 9);
    const result = diff(image, image.slice(), 64, 64, EXACT);
    expect([result.changedPixels, result.regionCount, result.mask.some(Boolean)]).toEqual([0, 0, false]);
  });
  it("re-diffs resident images by key without copying them again", () => {
    const key = {};
    const a = blank(16, 16), b = paint(blank(16, 16), 16, 0, 0, 4, 4);
    expect(diff(a, b, 16, 16, EXACT, key).changedPixels).toBe(16);
    // Same key: WASM memory still holds the first pair, so new inputs are ignored.
    expect(diff(a, a, 16, 16, EXACT, key).changedPixels).toBe(16);
    expect(diff(a, a, 16, 16, EXACT, {}).changedPixels).toBe(0);
  });
  it("grows memory for large captures and does not mutate earlier masks", () => {
    const first = diff(pixels(0, 0, 0, 255), pixels(255, 255, 255, 255), 1, 1, EXACT);
    const large = new Uint8ClampedArray(1024 * 1024 * 4);
    expect(diff(large, large, 1024, 1024, NORMAL).changedPixels).toBe(0);
    expect([...first.mask]).toEqual([1]);
  });
  it("rejects invalid dimensions, buffer sizes and thresholds before calling WASM", () => {
    for (const [width, height, threshold] of [[0, 1, NORMAL], [1.5, 1, NORMAL], [10000, 10000, NORMAL], [1, 1, -1], [1, 1, MAX_THRESHOLD + 1]]) {
      expect(() => diff(pixels(0, 0, 0, 255), pixels(0, 0, 0, 255), width, height, threshold)).toThrow("image");
    }
    expect(() => diff(pixels(0), pixels(0), 1, 1, EXACT)).toThrow("image");
  });
});
