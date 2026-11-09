import assert from "node:assert/strict";
import { test } from "node:test";
import { PRESETS } from "../src/glass.ts";
import {
  SCHEMA_VERSION, defaultSettings, editValue, effectiveValues, loadSettings, resetToBase, selectCustom, selectPreset,
} from "../src/state.ts";

test("an empty or broken data.json gives the defaults", () => {
  assert.deepEqual(loadSettings(undefined), defaultSettings());
  assert.deepEqual(loadSettings(null), defaultSettings());
  assert.deepEqual(loadSettings("not an object"), defaultSettings());
  assert.deepEqual(loadSettings({ schemaVersion: SCHEMA_VERSION }), defaultSettings());
});

test("version 1 settings left at their old defaults move to the Vitrine preset", () => {
  const s = loadSettings({ material: "mica", windowTint: 58, panelTint: 74, blurPx: 24, refraction: true, refractionStrength: 30, glassHeadings: { 3: true } });
  assert.equal(s.look, "vitrine");
  assert.equal(s.custom, null);
  assert.equal(s.material, "mica");
  assert.equal(s.headings.levels[3], true);
  assert.equal(s.headings.levels[1], true);
});

test("changed version 1 settings become Custom, based on Vitrine, in both modes", () => {
  const s = loadSettings({ windowTint: 10, panelTint: 60, blurPx: 30, refractionStrength: 45, refraction: false });
  assert.equal(s.look, "custom");
  assert.equal(s.custom?.basedOn, "vitrine");
  assert.equal(s.custom?.values.blur, 30);
  assert.equal(s.custom?.values.refraction, 45);
  assert.equal(s.custom?.values.dark.windowTint, 10);
  assert.equal(s.custom?.values.light.panelTint, 60);
  assert.equal(s.refractionEnabled, false);
});

test("an unknown preset id falls back to the default preset", () => {
  assert.equal(loadSettings({ schemaVersion: 2, look: "neon" }).look, "vitrine");
});

test("'custom' without a saved Custom look falls back to the default preset", () => {
  assert.equal(loadSettings({ schemaVersion: 2, look: "custom", custom: null }).look, "vitrine");
});

test("hand-edited Custom values are clamped when loading", () => {
  const s = loadSettings({ schemaVersion: 2, look: "custom", custom: { basedOn: "clear", values: { blur: 500, dark: { panelTint: "x" } } } });
  assert.equal(s.custom?.values.blur, 40);
  assert.equal(s.custom?.values.dark.panelTint, PRESETS.clear.values.dark.panelTint);
  assert.equal(s.custom?.values.radius, PRESETS.clear.values.radius);
});

test("moving a slider on a preset starts Custom from a copy of that preset", () => {
  const start = selectPreset(defaultSettings(), "frosted");
  const { settings, replacedCustom } = editValue(start, { key: "blur" }, 20);
  assert.equal(settings.look, "custom");
  assert.equal(settings.custom?.basedOn, "frosted");
  assert.equal(settings.custom?.values.blur, 20);
  assert.equal(settings.custom?.values.radius, PRESETS.frosted.values.radius);
  assert.equal(replacedCustom, false);
  assert.equal(PRESETS.frosted.values.blur, 40, "the built-in preset is not changed");
});

test("further moves change the same Custom look and replace nothing", () => {
  let s = editValue(defaultSettings(), { key: "blur" }, 10).settings;
  const second = editValue(s, { key: "windowTint", mode: "light" }, 60);
  s = second.settings;
  assert.equal(second.replacedCustom, false);
  assert.equal(s.custom?.values.blur, 10);
  assert.equal(s.custom?.values.light.windowTint, 60);
  assert.equal(s.custom?.values.dark.windowTint, PRESETS.vitrine.values.dark.windowTint);
});

test("moving a slider on a different preset replaces the one Custom slot and says so", () => {
  let s = editValue(defaultSettings(), { key: "blur" }, 10).settings;
  s = selectPreset(s, "soft");
  assert.equal(s.custom?.values.blur, 10, "picking a preset keeps the old Custom");
  const result = editValue(s, { key: "radius" }, 20);
  assert.equal(result.replacedCustom, true);
  assert.equal(result.settings.custom?.basedOn, "soft");
  assert.equal(result.settings.custom?.values.blur, PRESETS.soft.values.blur);
});

test("Custom can be picked again, and reset returns to its base preset", () => {
  let s = editValue(selectPreset(defaultSettings(), "clear"), { key: "fringe" }, 0).settings;
  s = selectPreset(s, "quiet");
  s = selectCustom(s);
  assert.equal(s.look, "custom");
  assert.equal(s.custom?.values.fringe, 0);
  s = resetToBase(s);
  assert.equal(s.look, "clear");
  assert.notEqual(s.custom, null);
});

test("effective values apply the floors and the refraction switch", () => {
  let s = editValue(defaultSettings(), { key: "panelTint", mode: "dark" }, 30).settings;
  assert.equal(effectiveValues(s).dark.panelTint, 45);
  s = { ...s, refractionEnabled: false };
  assert.equal(effectiveValues(s).refraction, 0);
  assert.equal(s.custom?.values.refraction, PRESETS.vitrine.values.refraction, "the saved value is kept");
});
