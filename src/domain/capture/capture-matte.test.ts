import { describe, expect, it } from "vitest";
import { extractMatte } from "./capture-matte";

const pixels = (...values: number[][]) => new Uint8ClampedArray(values.flat());

describe("extractMatte", () => {
  it("keeps pixels that match on both backgrounds and clears the background", () => {
    const onWhite = pixels([20, 40, 60, 255], [255, 255, 255, 255]);
    const onBlack = pixels([20, 40, 60, 255], [0, 0, 0, 255]);

    expect([...extractMatte(onWhite, onBlack, 2)]).toEqual([20, 40, 60, 255, 0, 0, 0, 0]);
  });

  it("recovers partial opacity and the original color of soft edges", () => {
    // A 50% opaque red pixel composited over white and over black.
    const onWhite = pixels([255, 127, 127, 255]);
    const onBlack = pixels([128, 0, 0, 255]);

    expect([...extractMatte(onWhite, onBlack, 1)]).toEqual([255, 0, 0, 128]);
  });

  it("keeps the live page opaque even if it changed between captures", () => {
    const onWhite = pixels([250, 250, 250, 255], [255, 255, 255, 255]);
    const onBlack = pixels([10, 10, 10, 255], [0, 0, 0, 255]);

    const matte = extractMatte(onWhite, onBlack, 2, { x: 0, y: 0, width: 1, height: 1 });

    expect([...matte.slice(0, 4)]).toEqual([10, 10, 10, 255]);
    expect(matte[7]).toBe(0);
  });

  it("ignores tiny differences from color conversion", () => {
    const onWhite = pixels([101, 101, 101, 255], [254, 253, 254, 255]);
    const onBlack = pixels([100, 100, 100, 255], [1, 2, 1, 255]);

    expect([...extractMatte(onWhite, onBlack, 2)]).toEqual([100, 100, 100, 255, 0, 0, 0, 0]);
  });
});
