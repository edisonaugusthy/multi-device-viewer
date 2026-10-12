import { MAX_IMAGE_PIXELS, VisualRegressionError, type ChangedRegion } from "./visual-regression.types";

interface DiffExports {
  memory: WebAssembly.Memory;
  diff: (a: number, b: number, marks: number, cells: number, width: number, height: number, maxDelta: number, antialias: number) => number;
  regions: (cells: number, stack: number, out: number, cols: number, rows: number, radius: number) => number;
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
  /** The largest regions, ordered top to bottom, with exact pixel bounds. */
  regions: ChangedRegion[];
  regionCount: number;
}
// 8px cells keep the overlay mask small (1 bit per 64 pixels) and match the
// WASM module, which counts per cell. Changes up to two cells apart are one
// region, so a reflowed line of text is one area.
export const CELL_SIZE = 8;
export const REGION_RADIUS = 2;
export const MAX_REGIONS = 20;
/**
 * Sensitivity is pixelmatch's 0–1 threshold as a percentage. 0 counts every
 * difference; above 0, anti-aliasing differences are ignored too.
 */
export const MAX_THRESHOLD = 100;
const MAX_YIQ_DELTA = 35215;
const CELL_BYTES = 8;

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
      || !Number.isInteger(threshold) || threshold < 0 || threshold > MAX_THRESHOLD) throw new VisualRegressionError("image");
    const bytes = pixels * 4;
    const columns = Math.ceil(width / CELL_SIZE), rows = Math.ceil(height / CELL_SIZE), count = columns * rows;
    const marks = bytes * 2, cells = marks + ((pixels + 16 + 15) & ~15);
    const stack = cells + count * CELL_BYTES, out = stack + count * 4, packed = out + count * 20;
    const maskBytes = Math.ceil(count / 8);
    ensureMemory(engine, packed + maskBytes);
    if (!key || key !== resident) {
      const memory = new Uint8Array(engine.memory.buffer);
      memory.set(baseline, 0);
      memory.set(latest, bytes);
      resident = key;
    }
    const maxDelta = Math.round(MAX_YIQ_DELTA * (threshold / MAX_THRESHOLD) ** 2);
    const changedPixels = engine.diff(0, bytes, marks, cells, width, height, maxDelta, threshold > 0 ? 1 : 0);
    const regionCount = changedPixels ? engine.regions(cells, stack, out, columns, rows, REGION_RADIUS) : 0;
    engine.pack(cells, packed, count);
    const records = new Uint32Array(engine.memory.buffer, out, regionCount * 5);
    const regions: ChangedRegion[] = [];
    for (let index = 0; index < regionCount; index++) {
      const [minX, minY, maxX, maxY, changed] = records.subarray(index * 5, index * 5 + 5);
      regions.push({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, pixels: changed });
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
