import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { CELL_SIZE, createPixelDiffer, MAX_REGIONS } from "./pixel-diff";

let diff: ReturnType<typeof createPixelDiffer>;
beforeAll(async () => {
  const bytes = await readFile(new URL("../../../public/wasm/pixel-diff.wasm", import.meta.url));
  const { instance } = await WebAssembly.instantiate(bytes);
  diff = createPixelDiffer(instance);
});
const pixels = (...values: number[]) => new Uint8ClampedArray(values);
const blank = (width: number, height: number) => new Uint8ClampedArray(width * height * 4).fill(255);
function paint(image: Uint8ClampedArray, width: number, x: number, y: number, w: number, h: number) {
  for (let row = y; row < y + h; row++) for (let column = x; column < x + w; column++) image.set([0, 0, 0, 255], (row * width + column) * 4);
  return image;
}
const bit = (mask: Uint8Array, cell: number) => (mask[cell >> 3] >> (cell & 7)) & 1;

describe("the packaged WASM pixel comparison", () => {
  it("counts changed pixels exactly", () => {
    const result = diff(pixels(0, 0, 0, 255, 10, 20, 30, 255), pixels(0, 0, 0, 255, 200, 20, 30, 255), 2, 1, 16);
    expect(result.changedPixels).toBe(1);
    expect(result.totalPixels).toBe(2);
  });
  it("ignores color noise at the threshold and invisible RGB", () => {
    expect(diff(pixels(10, 10, 10, 255), pixels(26, 26, 26, 255), 1, 1, 16).changedPixels).toBe(0);
    expect(diff(pixels(0, 0, 0, 0), pixels(255, 255, 255, 0), 1, 1, 0).changedPixels).toBe(0);
    expect(diff(pixels(0, 0, 0, 0), pixels(0, 0, 0, 255), 1, 1, 0).changedPixels).toBe(1);
  });
  it("matches a reference algorithm over mixed colors and alpha values", () => {
    const a = new Uint8ClampedArray(4096), b = new Uint8ClampedArray(4096);
    for (let i = 0; i < a.length; i++) { a[i] = (i * 37 + 19) % 256; b[i] = (i * 53 + 7) % 256; }
    for (const threshold of [0, 16, 64, 255]) {
      let expected = 0;
      for (let pixel = 0; pixel < a.length; pixel += 4) {
        const composite = (data: Uint8ClampedArray, channel: number) => Math.floor((data[pixel + channel] * data[pixel + 3] + 127) / 255) + 255 - data[pixel + 3];
        if ([0, 1, 2].some(channel => Math.abs(composite(a, channel) - composite(b, channel)) > threshold)) expected++;
      }
      expect(diff(a, b, 32, 32, threshold).changedPixels).toBe(expected);
    }
  });
  it("marks changed cells in a bit mask, including partial edge cells", () => {
    const width = 20, height = 10; // 3 × 2 cells; the last column and row are partial
    const result = diff(blank(width, height), paint(blank(width, height), width, 17, 9, 1, 1), width, height, 0);
    expect([result.columns, result.rows, result.cellSize]).toEqual([3, 2, CELL_SIZE]);
    expect([0, 1, 2, 3, 4, 5].map(cell => bit(result.mask, cell))).toEqual([0, 0, 0, 0, 0, 1]);
    expect(result.regions).toEqual([{ x: 16, y: 8, width: 4, height: 2, pixels: 1 }]);
  });
  it("joins nearby changes into one region and keeps distant ones apart", () => {
    const width = 200, height = 120;
    const latest = blank(width, height);
    paint(latest, width, 10, 10, 8, 4);    // cells 1–2
    paint(latest, width, 34, 10, 8, 4);    // cells 4–5: one empty cell between, still one area
    paint(latest, width, 150, 90, 20, 20); // far away: its own area
    const result = diff(blank(width, height), latest, width, height, 16);
    expect(result.changedPixels).toBe(8 * 4 * 2 + 400);
    expect(result.regionCount).toBe(2);
    // Three empty cells apart is too far to join.
    paint(latest, width, 66, 10, 2, 2);
    expect(diff(blank(width, height), latest, width, height, 16).regionCount).toBe(3);
    expect(result.regions).toEqual([
      { x: 8, y: 8, width: 40, height: 8, pixels: 64 },
      { x: 144, y: 88, width: 32, height: 24, pixels: 400 },
    ]);
  });
  it("reports the largest regions top to bottom and counts the rest", () => {
    const width = 1024, height = 64;
    const latest = blank(width, height);
    for (let index = 0; index < 30; index++) paint(latest, width, index * 32, (index % 2) * 40, 1 + (index % 5), 1);
    const result = diff(blank(width, height), latest, width, height, 0);
    expect(result.regionCount).toBe(30);
    expect(result.regions).toHaveLength(MAX_REGIONS);
    const ys = result.regions.map(region => region.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(Math.min(...result.regions.map(region => region.pixels))).toBeGreaterThanOrEqual(2);
  });
  it("returns no regions for identical images", () => {
    const image = paint(blank(64, 64), 64, 3, 3, 9, 9);
    const result = diff(image, image.slice(), 64, 64, 0);
    expect([result.changedPixels, result.regionCount, result.mask.some(Boolean)]).toEqual([0, 0, false]);
  });
  it("re-diffs resident images by key without copying them again", () => {
    const key = {};
    const a = blank(16, 16), b = paint(blank(16, 16), 16, 0, 0, 4, 4);
    expect(diff(a, b, 16, 16, 0, key).changedPixels).toBe(16);
    // Same key: WASM memory still holds the first pair, so new inputs are ignored.
    expect(diff(a, a, 16, 16, 0, key).changedPixels).toBe(16);
    expect(diff(a, a, 16, 16, 0, {}).changedPixels).toBe(0);
  });
  it("grows memory for large captures and does not mutate earlier masks", () => {
    const first = diff(pixels(0, 0, 0, 255), pixels(255, 255, 255, 255), 1, 1, 0);
    const large = new Uint8ClampedArray(1024 * 1024 * 4);
    expect(diff(large, large, 1024, 1024, 16).changedPixels).toBe(0);
    expect([...first.mask]).toEqual([1]);
  });
  it("rejects invalid dimensions, buffer sizes and thresholds before calling WASM", () => {
    for (const [width, height, threshold] of [[0, 1, 16], [1.5, 1, 16], [10000, 10000, 16], [1, 1, -1], [1, 1, 256]]) {
      expect(() => diff(pixels(0, 0, 0, 255), pixels(0, 0, 0, 255), width, height, threshold)).toThrow("image");
    }
    expect(() => diff(pixels(0), pixels(0), 1, 1, 0)).toThrow("image");
  });
});
