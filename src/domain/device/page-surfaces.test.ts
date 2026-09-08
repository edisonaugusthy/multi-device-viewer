import { expect, it } from "vitest";
import { compositeColors, prefersLightIcons } from "./page-surfaces";

it("keeps controls readable on black, white and a translucent layer", () => {
  expect(prefersLightIcons({ r: 0, g: 0, b: 0, a: 1 })).toBe(true);
  expect(prefersLightIcons({ r: 255, g: 255, b: 255, a: 1 })).toBe(false);
  expect(prefersLightIcons({ r: 0, g: 0, b: 0, a: 0.1 })).toBe(false);
  const redOverBlue = compositeColors({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 255, a: 1 });
  expect(redOverBlue).toEqual({ r: 127.5, g: 0, b: 127.5, a: 1 });
  expect(prefersLightIcons(redOverBlue)).toBe(true);
});
