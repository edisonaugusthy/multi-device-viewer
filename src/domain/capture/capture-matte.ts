export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Pixels whose two captures differ by this much or less are treated as exact.
const NOISE = 3;

/**
 * Recovers a transparent cutout from the same view captured over a white and a
 * black background. Anything that looks identical on both (the device frame and
 * page) stays opaque, the background becomes transparent, and antialiased edges
 * and shadows keep their partial opacity.
 *
 * `opaque` marks the live page area. A page may animate between the two
 * captures, so those pixels are always kept opaque instead of being matted.
 */
export function extractMatte(
  onWhite: Uint8ClampedArray,
  onBlack: Uint8ClampedArray,
  width: number,
  opaque?: PixelRect,
): Uint8ClampedArray<ArrayBuffer> {
  const output = new Uint8ClampedArray(onBlack.length);
  for (let index = 0; index < onBlack.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const inPage = opaque !== undefined
      && x >= opaque.x && x < opaque.x + opaque.width
      && y >= opaque.y && y < opaque.y + opaque.height;
    const difference = (
      onWhite[index] - onBlack[index]
      + onWhite[index + 1] - onBlack[index + 1]
      + onWhite[index + 2] - onBlack[index + 2]
    ) / 3;
    const alpha = inPage || difference <= NOISE ? 255 : difference >= 255 - NOISE ? 0 : Math.round(255 - difference);
    if (alpha === 0) continue;
    // Over black, a pixel shows only its own color scaled by its opacity.
    const unpremultiply = (value: number) => alpha === 255 ? value : Math.min(255, Math.round((value * 255) / alpha));
    output[index] = unpremultiply(onBlack[index]);
    output[index + 1] = unpremultiply(onBlack[index + 1]);
    output[index + 2] = unpremultiply(onBlack[index + 2]);
    output[index + 3] = alpha;
  }
  return output;
}
