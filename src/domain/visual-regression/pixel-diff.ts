import { MAX_IMAGE_PIXELS, VisualRegressionError, type ChangedRegion } from "./visual-regression.types";

interface DiffExports {
  memory: WebAssembly.Memory;
  diff: (a: number, b: number, cells: number, width: number, height: number, threshold: number, size: number) => number;
  regions: (cells: number, labels: number, stack: number, out: number, cols: number, rows: number, radius: number) => number;
  pack: (cells: number, out: number, count: number) => void;
}
export interface PixelDiff {
  changedPixels: number;
  totalPixels: number;
  cellSize: number;
  columns: number;
  rows: number;
  /** One bit per cell, least significant bit first. */
  mask: Uint8Array;
  /** The largest regions, ordered top to bottom. */
  regions: ChangedRegion[];
  regionCount: number;
}
// 8px cells keep the overlay mask small (1 bit per 64 pixels). Changes up to
// two cells apart are one region, so a reflowed line of text is one area.
export const CELL_SIZE = 8;
export const REGION_RADIUS = 2;
export const MAX_REGIONS = 20;

function ensureMemory(engine: DiffExports, bytes: number) {
  const pages = Math.ceil(bytes / 65536);
  const currentPages = engine.memory.buffer.byteLength / 65536;
  if (pages > currentPages) engine.memory.grow(pages - currentPages);
}
export function createPixelDiffer(instance: WebAssembly.Instance) {
  const engine = instance.exports as unknown as DiffExports;
  let resident: object | undefined;
  /** Pass the same `key` for repeated comparisons of the same two images to skip copying them in again. */
  return (baseline: Uint8ClampedArray, latest: Uint8ClampedArray, width: number, height: number, threshold: number, key?: object): PixelDiff => {
    const pixels = width * height;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0
      || pixels > MAX_IMAGE_PIXELS || baseline.length !== pixels * 4 || latest.length !== pixels * 4
      || !Number.isInteger(threshold) || threshold < 0 || threshold > 255) throw new VisualRegressionError("image");
    const bytes = pixels * 4;
    const columns = Math.ceil(width / CELL_SIZE), rows = Math.ceil(height / CELL_SIZE), count = columns * rows;
    const cells = bytes * 2, labels = cells + count * 4, stack = labels + count * 4, out = stack + count * 4, packed = out + count * 20;
    const maskBytes = Math.ceil(count / 8);
    ensureMemory(engine, packed + maskBytes);
    if (!key || key !== resident) {
      const memory = new Uint8Array(engine.memory.buffer);
      memory.set(baseline, 0);
      memory.set(latest, bytes);
      resident = key;
    }
    const changedPixels = engine.diff(0, bytes, cells, width, height, threshold, CELL_SIZE);
    const regionCount = changedPixels ? engine.regions(cells, labels, stack, out, columns, rows, REGION_RADIUS) : 0;
    engine.pack(cells, packed, count);
    const records = new Uint32Array(engine.memory.buffer, out, regionCount * 5);
    const regions: ChangedRegion[] = [];
    for (let index = 0; index < regionCount; index++) {
      const [minColumn, minRow, maxColumn, maxRow, changed] = records.subarray(index * 5, index * 5 + 5);
      const x = minColumn * CELL_SIZE, y = minRow * CELL_SIZE;
      regions.push({ x, y, width: Math.min((maxColumn + 1) * CELL_SIZE, width) - x, height: Math.min((maxRow + 1) * CELL_SIZE, height) - y, pixels: changed });
    }
    regions.sort((a, b) => b.pixels - a.pixels);
    const shown = regions.slice(0, MAX_REGIONS).sort((a, b) => a.y - b.y || a.x - b.x);
    // Own the output: the next comparison reuses the WASM memory.
    const mask = new Uint8Array(engine.memory.buffer.slice(packed, packed + maskBytes));
    return { changedPixels, totalPixels: pixels, cellSize: CELL_SIZE, columns, rows, mask, regions: shown, regionCount };
  };
}
let engine: Promise<ReturnType<typeof createPixelDiffer>> | undefined;
export async function getPixelDiffer() {
  engine ??= (async () => {
    const url = typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("wasm/pixel-diff.wasm") : "/wasm/pixel-diff.wasm";
    const response = await fetch(url);
    if (!response.ok) throw new VisualRegressionError("engine");
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer());
    return createPixelDiffer(instance);
  })().catch(() => { engine = undefined; throw new VisualRegressionError("engine"); });
  return engine;
}
