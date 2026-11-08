# Liquid Glass plugin source

## Overview

TypeScript source for the Liquid Glass Obsidian plugin. It does three things for the Liquid Glass theme:

- On Windows, it asks the OS for an acrylic or Mica window material through Electron, so the desktop wallpaper shows through the window.
- It gives each floating panel its own SVG displacement filter, so content behind the panel bends at its edges.
- It passes the user's settings to the theme as classes and CSS variables on `document.body`.

The theme does all the styling. This code only switches it on and feeds it values.

## Interface

- `src/main.ts`
  - `LiquidGlassPlugin` (default export, extends Obsidian's `Plugin`). Public members: `settings: LiquidGlassSettings`, `materialStatus: MaterialStatus`, `onload()`, `saveSettings()`, `applyLook()`, `applyMaterial()`.
- `src/settings.ts`
  - `LiquidGlassSettings`, the settings shape, and `HeadingLevel` (`1`–`6`).
  - `DEFAULT_SETTINGS`: material `"acrylic"`, window tint 58, panel tint 74, blur 24 px, refraction on at strength 30, glass on H1, H2 and the note title, in both views, spectrum off.
  - `withDefaults(saved)`, which merges saved data over `DEFAULT_SETTINGS`.
  - `LiquidGlassSettingTab` (extends Obsidian's `PluginSettingTab`).
- `src/refraction.ts`
  - `Refractor` (`constructor(doc, strength)`, `start()`, `stop()`, `setStrength(strength)`).
  - `GLASS_SELECTOR`: `.modal, .prompt, .menu, .suggestion-container, .popover.hover-popover, .notice, .status-bar`.
- `src/displacement.ts` has pure functions with no DOM:
  - `bezelRamp(length, maxBezel = MAX_BEZEL_PX)` returns per-pixel channel values along one axis.
  - `displacementPixels(width, height)` returns RGBA pixels for one map.
  - `MAX_BEZEL_PX` = 22.
- `src/window-material.ts`
  - `Material` is `"acrylic" | "mica" | "tabbed" | "none"`.
  - `MaterialStatus` is `"unsupported-os" | "off" | "on" | "no-api" | "failed"`.
  - `currentWindow()` returns the Electron window from `require("@electron/remote").getCurrentWindow()`, or `null`.

## Invariants

- Contract with the theme: the body classes `lg-plugin`, `lg-h1` to `lg-h6`, `lg-inline-title`, `lg-edit`, `lg-read` and `lg-spectrum`; the body variables `--lg-window-tint`, `--lg-float-tint` and `--lg-blur`; and `--lg-refract` on each tracked panel. Renaming any of them means changing `theme.css` too (`main.ts:BODY_CLASSES`, `main.ts:BODY_VARIABLES`, `refraction.ts:track`).
- `GLASS_SELECTOR` must list the same panels as the theme's frosted-panel rule, or a panel gets refraction without the glass look, or the reverse.
- `currentWindow()` returns a window only if it has a `setBackgroundMaterial` function, and returns `null` on any error (`window-material.ts:currentWindow`).
- `applyMaterial()` does nothing but set `materialStatus = "unsupported-os"` when `Platform.isWin` is false. It sets `"no-api"` when there's no window, `"failed"` when the call throws, and `"on"` when the call succeeds.
- The plugin adds `is-translucent` only if the body didn't already have it, and removes it only if the plugin added it (`main.ts:addedTranslucentClass`).
- Refraction starts only after `app.workspace.layoutReady`, and at most one `Refractor` exists. Refraction runs only when `settings.refraction` is true and `refractionStrength` is above 0 (`main.ts:applyLook`).
- `withDefaults` merges `glassHeadings` key by key, so a saved file missing a level keeps that level's default (`settings.ts:withDefaults`).
- Displacement maps are 128 (no shift) in the middle and ramp quadratically within `min(22, 0.45 × length)` px of each edge: R from the x axis, G from the y axis, B = 128, A = 255 (`displacement.ts`).
- Each panel is tracked once and has a unique filter id `lg-refract-N`. A map is rebuilt only when the panel's non-zero size changes. At most one animation frame is pending (`refraction.ts:track`, `resize`, `schedule`).
- Channel scales are `round(strength × [1, 0.9, 0.8])` for red, green and blue (`refraction.ts:CHANNEL_SCALES`).
- The map cache holds at most 24 sizes and drops the oldest first (`refraction.ts:MAP_CACHE_LIMIT`).
- `Refractor` works on one document. Pop-out windows get no refraction.

## Side Effects

- `onload` reads saved data (`loadData`), adds the settings tab, and registers cleanup. Cleanup stops the `Refractor`, removes the plugin's body classes and variables, and removes the window material.
- `applyLook` toggles body classes, sets body CSS variables, and creates, retunes or stops the `Refractor`.
- `applyMaterial` and `removeMaterial` call `BrowserWindow.setBackgroundMaterial` through `@electron/remote`, add or remove `is-translucent` on `<body>`, and log to `console.error` on failure.
- `Refractor.start` appends a hidden `<svg class="lg-refraction-defs">` to `<body>` and observes `<body>` for added and removed nodes, including the whole subtree.
- `Refractor.track` appends one `<filter>` per panel, sets `--lg-refract` inline on the panel, and watches it with a `ResizeObserver`. `untrack` reverses all three.
- `Refractor.mapUrl` draws to an off-screen canvas and keeps PNG data URLs in memory.
- `saveSettings` writes `data.json` through Obsidian's `saveData`.
- The settings tab rebuilds its UI on every `display()`. Each change saves settings, then calls `applyLook()`, or `applyMaterial()` for the material dropdown.

## Verification

- Run: `npm test` (from `plugin/liquid-glass`). Tests cover `displacement.ts` only.
- Run: `npm run typecheck`
