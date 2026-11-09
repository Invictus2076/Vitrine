import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CONTRACT_VERSION, GLASS_SELECTOR, GLASS_VARIABLE_NAMES, glassVariables } from "../src/css.ts";
import { PRESETS } from "../src/glass.ts";

const theme = readFileSync(new URL("../../../theme/Vitrine/theme.css", import.meta.url), "utf8");

/** Every `var(--vt-…, fallback)` in the theme, as name → fallback. */
function themeFallbacks(): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of theme.matchAll(/var\((--vt-[a-z-]+),\s*([^)]+)\)/g)) {
    const [, name, fallback] = match;
    const previous = found.get(name);
    assert.ok(previous === undefined || previous === fallback.trim(), `${name} has two different fallbacks`);
    found.set(name, fallback.trim());
  }
  return found;
}

test("the theme's fallbacks equal the Vitrine preset, so enabling the plugin changes nothing", () => {
  const fallbacks = themeFallbacks();
  for (const [name, value] of Object.entries(glassVariables(PRESETS.vitrine.values))) {
    assert.equal(fallbacks.get(name), value, name);
  }
});

test("the theme reads every variable the plugin writes", () => {
  const fallbacks = themeFallbacks();
  for (const name of GLASS_VARIABLE_NAMES) assert.ok(fallbacks.has(name), `theme never reads ${name}`);
});

test("the theme declares the same contract version as the plugin", () => {
  assert.match(theme, new RegExp(`--vt-contract:\\s*${CONTRACT_VERSION};`));
});

test("the theme frosts exactly the panels the plugin refracts", () => {
  const rule = theme.match(/((?:\.[a-z-]+(?:\.[a-z-]+)?,\s*)+\.[a-z-]+)\s*\{\s*background-color: var\(--lg-panel-fill\)/);
  assert.ok(rule, "frosted-panel rule not found");
  const themePanels = rule[1].split(",").map((s) => s.trim()).sort();
  const pluginPanels = GLASS_SELECTOR.split(",").map((s) => s.trim()).sort();
  assert.deepEqual(themePanels, pluginPanels);
});

test("manifest versions match", () => {
  const plugin = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const versions = JSON.parse(readFileSync(new URL("../versions.json", import.meta.url), "utf8"));
  const themeManifest = JSON.parse(readFileSync(new URL("../../../theme/Vitrine/manifest.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, plugin.version);
  assert.equal(themeManifest.version, plugin.version);
  assert.equal(versions[plugin.version], plugin.minAppVersion);
});

test("nothing published mentions a personal website", () => {
  const files = ["../manifest.json", "../package.json", "../../../theme/Vitrine/manifest.json", "../../../theme/Vitrine/theme.css"];
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(text, /pages\.dev|authorUrl|website/i, file);
  }
});
