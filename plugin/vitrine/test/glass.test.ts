import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MODE_FIELDS, PRESETS, PRESET_IDS, READABILITY_FLOORS, SHARED_FIELDS,
  applyFloors, channelScales, sanitizeValues, type ModeKey, type SharedKey,
} from "../src/glass.ts";

test("every preset value is inside its slider range", () => {
  for (const id of PRESET_IDS) {
    const values = PRESETS[id].values;
    for (const [key, spec] of Object.entries(SHARED_FIELDS) as [SharedKey, (typeof SHARED_FIELDS)[SharedKey]][]) {
      assert.ok(values[key] >= spec.min && values[key] <= spec.max, `${id}.${key} = ${values[key]}`);
    }
    for (const mode of ["dark", "light"] as const) {
      for (const [key, spec] of Object.entries(MODE_FIELDS) as [ModeKey, (typeof MODE_FIELDS)[ModeKey]][]) {
        const v = values[mode][key];
        assert.ok(v >= spec.min && v <= spec.max, `${id}.${mode}.${key} = ${v}`);
      }
    }
  }
});

test("every preset already meets the readability floors", () => {
  for (const id of PRESET_IDS) {
    assert.deepEqual(applyFloors(PRESETS[id].values), PRESETS[id].values, id);
  }
});

test("floors raise values that are too low and leave the rest alone", () => {
  const low = structuredClone(PRESETS.clear.values);
  low.dark.panelTint = 30;
  low.light.windowTint = 0;
  const floored = applyFloors(low);
  assert.equal(floored.dark.panelTint, READABILITY_FLOORS.dark.panelTint);
  assert.equal(floored.light.windowTint, READABILITY_FLOORS.light.windowTint);
  assert.equal(floored.dark.windowTint, low.dark.windowTint);
});

test("sanitizing fills gaps, clamps ranges and rejects non-numbers", () => {
  const fallback = PRESETS.vitrine.values;
  const result = sanitizeValues({ blur: 999, saturation: "lots", radius: 12.6, dark: { windowTint: -5 }, light: null }, fallback);
  assert.equal(result.blur, SHARED_FIELDS.blur.max);
  assert.equal(result.saturation, fallback.saturation);
  assert.equal(result.radius, 13);
  assert.equal(result.dark.windowTint, 0);
  assert.equal(result.dark.panelTint, fallback.dark.panelTint);
  assert.deepEqual(result.light, fallback.light);
  assert.deepEqual(sanitizeValues(undefined, fallback), fallback);
});

test("channel scales: no fringe keeps channels together, fringe spreads them", () => {
  assert.deepEqual(channelScales(30, 0), [30, 30, 30]);
  assert.deepEqual(channelScales(30, 10), [30, 27, 24]);
  assert.deepEqual(channelScales(0, 30), [0, 0, 0]);
});
