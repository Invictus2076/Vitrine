# Vitrine plugin source

## Overview

TypeScript source for the Vitrine Obsidian plugin. It works out a glass look from a preset or the user's Custom values, and passes it to the Vitrine theme as CSS variables and body classes. It gives each floating panel an SVG displacement filter so its edges bend what is behind them. On Windows it asks the OS for an acrylic or Mica window material, so the desktop wallpaper shows through. The theme does all the drawing.

Pure modules (`glass.ts`, `state.ts`, `css.ts`, `displacement.ts`, `diagnostics.ts`) hold the logic and have no DOM. The rest connect it to Obsidian.

## Interface

- `src/glass.ts`, the glass values and presets
  - `GlassValues`: shared values (`blur`, `saturation`, `radius`, `refraction`, `bezel`, `fringe`) plus per-mode `ModeValues` (`windowTint`, `panelTint`, `highlight`, `ring`) under `dark` and `light`.
  - `SHARED_FIELDS`, `MODE_FIELDS`: name, description, unit and range of every value, used by the settings tab and for clamping.
  - `PRESETS`, `PRESET_IDS` (`vitrine`, `clear`, `frosted`, `soft`, `quiet`), `DEFAULT_PRESET` (`vitrine`).
  - `READABILITY_FLOORS`: the minimum panel tint (dark 45%, light 55%) and light-mode window tint (35%) any look can reach.
  - `sanitizeValues(raw, fallback)`, `applyFloors(values)`, `clamp`, `cloneValues`, `channelScales(strength, fringe)`.
- `src/state.ts`, the saved settings
  - `VitrineSettings`: `schemaVersion` (2), `look` (a preset id or `"custom"`), `custom` (`{ basedOn, values }` or `null`), `material`, `refractionEnabled`, `panelBlur`, `headings`, `showAdvanced`.
  - `loadSettings(saved)` turns any `data.json` (version 1, version 2, partial, hand-edited or empty) into valid settings. `migrateV1(old)` does the version 1 step.
  - `chosenValues(settings)`, `effectiveValues(settings)` (with floors and the refraction and panel blur switches applied).
  - `selectPreset`, `selectCustom`, `resetToBase`, `editValue(settings, target, value)` returning `{ settings, replacedCustom }`.
- `src/css.ts`, the plugin–theme contract
  - `CONTRACT_VERSION` (2), `GLASS_SELECTOR`, `glassVariables(values)`, `GLASS_VARIABLE_NAMES`, `headingClasses(headings)`, `HEADING_CLASS_NAMES`.
- `src/displacement.ts`: `bezelRamp(length, maxBezel)`, `displacementPixels(width, height, maxBezel)`, `MAX_BEZEL_PX` (22).
- `src/refraction.ts`: `Refractor` (`constructor(doc, options)`, `start()`, `stop()`, `setOptions({ strength, bezel, fringe })`, `panelCount`, `cachedMaps`).
- `src/diagnostics.ts`: `formatDiagnostics(input)`, `ThemeState`.
- `src/window-material.ts`: `Material`, `MaterialStatus`, `currentWindow()`, `nodeRequire(id)`.
- `src/settings-tab.ts`: `VitrineSettingTab`.
- `src/main.ts`: `VitrinePlugin` (default export). Public members: `settings`, `materialStatus`, `update(next)`, `applyLook()`, `applyMaterial()`, `themeState()`, `copyDiagnostics()`. Command `copy-diagnostics`.

## Invariants

- A built-in preset is saved by id, and its values come from `PRESETS`, so retuning a preset reaches everyone using it. Custom is a full copy of every value for both modes, so it never changes on its own (`state.ts`).
- There is one Custom slot. Moving a slider on a built-in preset starts Custom from a copy of that preset and replaces any older Custom; `editValue` reports that as `replacedCustom`. Picking a preset keeps Custom saved. `resetToBase` goes back to Custom's preset and keeps Custom.
- `loadSettings` never returns `undefined` or out-of-range numbers. Unknown preset ids fall back to `vitrine`, and `"custom"` without saved Custom values falls back to `vitrine`. Version 1 data left at its old defaults becomes the Vitrine preset; changed version 1 data becomes Custom based on Vitrine.
- Every value drawn passes through `effectiveValues`, which applies the readability floors and sets refraction to 0 when the refraction switch is off and blur to 0 when the panel blur switch is off. The saved values are not changed.
- `glassVariables` writes each per-mode value under a `--vt-dark-*` and a `--vt-light-*` name, and never the theme's own `--lg-*` names. The theme picks the right one.
- `Refractor` caches maps by panel size and edge width. Changing the edge width clears the cache and redraws every tracked panel, 150 ms after the last change. Strength and fringe changes update the filters at once.
- `channelScales` gives red the full strength and moves green and blue down by `fringe` percent per step.
- `VitrineSettingTab` never rebuilds itself while a slider moves: it updates the preset dropdown, its description and the reset button in place.
- `currentWindow()` returns a window only if it has `setBackgroundMaterial`, and `null` on any error. `applyMaterial()` sets `materialStatus` to `"unsupported-os"`, `"off"`, `"no-api"`, `"failed"` or `"on"`. The plugin adds `is-translucent` only if the body didn't have it, and removes it only if it added it.
- Refraction starts only after `app.workspace.layoutReady`, and at most one `Refractor` exists.
- Panels go through the `Refractor`'s SVG filter whenever they blur or bend (`needsPanelFilter` in `glass.ts`). The filter runs even at strength 0, because in a translucent Windows window the browser draws no blur behind a panel unless its backdrop filter includes an SVG filter. Measured in Obsidian 1.15.0 (Electron 44) on Windows 11.

## Side Effects

- `onload` reads `data.json`, applies the look and the window material, adds the settings tab and the `copy-diagnostics` command, and registers cleanup. Cleanup saves any pending change, stops refraction, removes the plugin's body classes and variables, and removes the window material.
- `update` applies the look at once and writes `data.json` 600 ms after the last change. `onExternalSettingsChange` reloads and re-applies settings changed on disk, for example by Sync.
- `applyLook` toggles body classes, sets `--vt-*` variables inline on `<body>`, and creates, retunes or stops the `Refractor`.
- `applyMaterial` and cleanup call `BrowserWindow.setBackgroundMaterial` through `@electron/remote`, add or remove `is-translucent`, and log to `console.error` on failure.
- `Refractor` appends a hidden `<svg class="lg-refraction-defs">` to `<body>` and one `<filter>` per panel, sets `--lg-refract` on each panel, observes `<body>` for added and removed nodes, and keeps PNG data URLs in memory.
- `copyDiagnostics` reads computed styles and the OS version, writes a text report to the clipboard and shows a notice. It sends nothing over the network.
- The settings tab shows notices when a slider replaces an older Custom.

## Verification

- Run: `npm run build && npm test` (from `plugin/vitrine`).
