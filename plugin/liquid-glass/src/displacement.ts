/**
 * Displacement maps for feDisplacementMap. These are pure functions, so they can be tested without a DOM.
 *
 * In the map, red is horizontal displacement and green is vertical; 128 means no shift.
 * Inside a bezel along each edge the value ramps quadratically away from 128, so content
 * near the rim of a panel is sampled from further inside it, as a curved glass edge would.
 * This is the same ramp as the nav bar on siddharthkhati.pages.dev, applied on both axes.
 */

export const MAX_BEZEL_PX = 22;

/** Per-pixel channel values along one axis of the given length. */
export function bezelRamp(length: number, maxBezel = MAX_BEZEL_PX): Uint8ClampedArray {
  const ramp = new Uint8ClampedArray(length);
  const bezel = Math.min(maxBezel, length * 0.45);
  for (let i = 0; i < length; i++) {
    const nearStart = Math.max(0, 1 - (i + 0.5) / bezel);
    const nearEnd = Math.max(0, 1 - (length - i - 0.5) / bezel);
    ramp[i] = Math.round(128 + (nearStart * nearStart - nearEnd * nearEnd) * 127);
  }
  return ramp;
}

/** RGBA pixels for a width × height map, ready for ImageData. */
export function displacementPixels(width: number, height: number): Uint8ClampedArray<ArrayBuffer> {
  const x = bezelRamp(width);
  const y = bezelRamp(height);
  const pixels = new Uint8ClampedArray(width * height * 4);
  let i = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++, i += 4) {
      pixels[i] = x[col];
      pixels[i + 1] = y[row];
      pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}
