import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_BEZEL_PX, bezelRamp, displacementPixels } from "../src/displacement.ts";

test("the middle of a large panel is not displaced", () => {
  const ramp = bezelRamp(400);
  for (let i = MAX_BEZEL_PX; i < 400 - MAX_BEZEL_PX; i++) assert.equal(ramp[i], 128, `pixel ${i}`);
});

test("edges shift in opposite directions, strongest at the rim", () => {
  const ramp = bezelRamp(400);
  assert.ok(ramp[0] > 240, `start edge ${ramp[0]}`);
  assert.ok(ramp[399] < 16, `end edge ${ramp[399]}`);
  for (let i = 1; i < MAX_BEZEL_PX; i++) assert.ok(ramp[i] <= ramp[i - 1], `start ramp falls at ${i}`);
});

test("the ramp is symmetric around 128", () => {
  const ramp = bezelRamp(137);
  for (let i = 0; i < ramp.length; i++) {
    assert.ok(Math.abs(ramp[i] + ramp[ramp.length - 1 - i] - 256) <= 1, `pixels ${i} and its mirror`);
  }
});

test("on a panel narrower than two bezels, the bezel shrinks to fit", () => {
  const ramp = bezelRamp(20);
  assert.equal(ramp.length, 20);
  assert.ok(ramp[0] > 128 && ramp[19] < 128);
});

test("pixels pack red from the x ramp, green from the y ramp, blue 128, alpha 255", () => {
  const width = 60;
  const height = 50;
  const pixels = displacementPixels(width, height);
  const x = bezelRamp(width);
  const y = bezelRamp(height);
  assert.equal(pixels.length, width * height * 4);
  for (const [col, row] of [[0, 0], [30, 25], [59, 49], [5, 44]]) {
    const i = (row * width + col) * 4;
    assert.deepEqual([...pixels.subarray(i, i + 4)], [x[col], y[row], 128, 255]);
  }
});
