import { describe, expect, it } from "vitest";
import { fitDesign, isDefaultFit, moveDesign, nudgeDesign, placeDesign, resizeDesign, sizeDesign, snapTo } from "./design-frame";

const screen = { width: 402, height: 874 };

describe("fitting a design to the screen", () => {
  it("matches the screen width from the top, so a full-screen export lands exactly", () => {
    expect(fitDesign({ width: 804, height: 1748 }, screen, "width")).toEqual({ x: 0, y: 0, width: 402, height: 874 });
    expect(fitDesign({ width: 402, height: 520 }, screen, "width")).toEqual({ x: 0, y: 0, width: 402, height: 520 });
  });

  it("shows a whole tall design inside the screen, centred", () => {
    expect(fitDesign({ width: 402, height: 1748 }, screen, "screen")).toEqual({ x: 100.5, y: 0, width: 201, height: 874 });
    expect(fitDesign({ width: 402, height: 520 }, screen, "screen")).toEqual({ x: 0, y: 177, width: 402, height: 520 });
  });

  it("stretches over the screen, and falls back to that for an image without a size", () => {
    expect(fitDesign({ width: 300, height: 300 }, screen, "stretch")).toEqual({ x: 0, y: 0, width: 402, height: 874 });
    expect(fitDesign({ width: 0, height: 0 }, screen, "width")).toEqual({ x: 0, y: 0, width: 402, height: 874 });
  });

  it("recognises the default placement within half a pixel", () => {
    const image = { width: 402, height: 520 };
    expect(isDefaultFit({ x: 0, y: 0.4, width: 402, height: 520 }, image, screen)).toBe(true);
    expect(isDefaultFit({ x: 0, y: 1, width: 402, height: 520 }, image, screen)).toBe(false);
  });
});

describe("moving a design", () => {
  const frame = { x: 0, y: 0, width: 402, height: 520 };

  it("snaps to the screen edges and centre within reach, and nowhere else", () => {
    expect(snapTo(4, [0, 100], 6)).toBe(0);
    expect(snapTo(7, [0, 100], 6)).toBe(7);
    expect(moveDesign(frame, 0, 350, screen, 6)).toEqual({ ...frame, y: 354 });
    expect(moveDesign(frame, 0, 173, screen, 6)).toEqual({ ...frame, y: 177 });
    expect(moveDesign(frame, 0, 173, screen)).toEqual({ ...frame, y: 173 });
  });

  it("keeps part of the design over the screen", () => {
    expect(moveDesign(frame, -1000, 2000, screen)).toEqual({ ...frame, x: -386, y: 858 });
    expect(placeDesign(frame, { x: 390 }, screen)).toEqual({ ...frame, x: 386 });
  });

  it("nudges by one pixel, ten with Shift, and ignores other keys", () => {
    expect(nudgeDesign(frame, "ArrowRight", false, screen)).toEqual({ ...frame, x: 1 });
    expect(nudgeDesign(frame, "ArrowDown", true, screen)).toEqual({ ...frame, y: 10 });
    expect(nudgeDesign(frame, "Enter", false, screen)).toBeUndefined();
  });
});

describe("resizing a design", () => {
  const frame = { x: 10, y: 20, width: 200, height: 100 };

  it("keeps the proportions from a corner and anchors the opposite corner", () => {
    expect(resizeDesign(frame, "se", 100, 0, { screen })).toEqual({ x: 10, y: 20, width: 300, height: 150 });
    expect(resizeDesign(frame, "nw", -100, 0, { screen })).toEqual({ x: -90, y: -30, width: 300, height: 150 });
    expect(resizeDesign(frame, "ne", 0, 50, { screen })).toEqual({ x: 10, y: 70, width: 100, height: 50 });
  });

  it("resizes a corner freely when asked", () => {
    expect(resizeDesign(frame, "se", 100, 30, { screen, free: true })).toEqual({ x: 10, y: 20, width: 300, height: 130 });
  });

  it("stretches one axis from an edge and snaps that side to the screen edge", () => {
    expect(resizeDesign(frame, "e", 50, 500, { screen })).toEqual({ ...frame, width: 250 });
    expect(resizeDesign(frame, "s", 500, 30, { screen })).toEqual({ ...frame, height: 130 });
    expect(resizeDesign(frame, "e", 188, 0, { screen, snap: 6 })).toEqual({ ...frame, width: 392 });
    expect(resizeDesign(frame, "w", -7, 0, { screen, snap: 6 })).toEqual({ ...frame, x: 0, width: 210 });
  });

  it("never collapses below the minimum size", () => {
    expect(resizeDesign(frame, "e", -500, 0, { screen })).toEqual({ ...frame, width: 8 });
    expect(resizeDesign(frame, "n", 0, 500, { screen })).toEqual({ ...frame, y: 112, height: 8 });
    expect(sizeDesign(frame, { width: 0 }, false)).toEqual({ ...frame, width: 8 });
  });

  it("follows a typed size on the other side only while proportions are kept", () => {
    expect(sizeDesign(frame, { width: 400 }, true)).toEqual({ ...frame, width: 400, height: 200 });
    expect(sizeDesign(frame, { height: 300 }, true)).toEqual({ ...frame, width: 600, height: 300 });
    expect(sizeDesign(frame, { width: 400 }, false)).toEqual({ ...frame, width: 400 });
  });
});
