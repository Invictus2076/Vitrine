# Vitrine architecture

How the theme and the plugin fit together, what must stay true, and how to check it. For installing and using Vitrine, see the [README](./README.md).

## System Overview

Two parts that Obsidian loads separately, joined by CSS:

- **Theme** (`theme/Vitrine/theme.css`) does all the drawing. It makes Obsidian's panes clear over one tinted base, frosts the floating panels, and fills headings with a glass gradient. Wherever Obsidian documents a variable for a surface (`--modal-background`, `--status-bar-background`, `--workspace-background-translucent`, the tab and ribbon variables), it sets the variable rather than overriding the element.
- **Plugin** (`plugin/vitrine`) never draws. It works out the look from the chosen preset or Custom values and passes it to the theme as `--vt-*` variables and body classes. It gives each floating panel an SVG displacement filter for refraction. On Windows it asks the OS for an acrylic or Mica window.

## Subdirectories & System Boundaries

- plugin: [`./plugin/README.md`](./plugin/README.md). Holds the plugin package, `vitrine`: presets and settings, refraction on floating panels, the Windows window material and diagnostics.
- theme/Vitrine: `theme.css` and `manifest.json`. It has no contract file of its own, because EGM bootstrap documents code folders and treats CSS as non-code. Its side of the plugin contract is listed under Global Invariants.
- concepts_brief.md: the design brief this version was built from.

Each of `theme/Vitrine` and `plugin/vitrine` holds everything Obsidian's community lists need for its kind (manifest, LICENSE, and for the plugin `versions.json`). Obsidian lists themes and plugins from separate repositories with those files at the root, so each folder can be split into its own repository when it is submitted.

## Global Invariants

- **Plugin–theme contract, version 2.** The theme sets `--vt-contract: 2` on `<body>`. The plugin warns in its settings tab when the value is missing (theme not active) or different (mismatched versions). The plugin writes:
  - shared values: `--vt-blur`, `--vt-saturation`, `--vt-radius`;
  - per mode: `--vt-dark-window-tint`, `--vt-dark-panel-tint`, `--vt-dark-highlight`, `--vt-dark-ring` and the same four `--vt-light-*` variables;
  - the body classes `lg-plugin`, `lg-h1` to `lg-h6`, `lg-inline-title`, `lg-edit`, `lg-read`, `lg-spectrum`;
  - `--lg-refract` on each floating panel.

  The theme reads every `--vt-*` variable with a fallback, and picks the dark or light set inside `.theme-dark` and `.theme-light`, so switching mode needs nothing from the plugin.
- **The theme's fallbacks equal the Vitrine preset.** Enabling the plugin with default settings changes nothing on screen. `plugin/vitrine/test/contract.test.ts` enforces this.
- The theme's frosted-panel rule and the plugin's `GLASS_SELECTOR` list the same seven panels: `.modal`, `.prompt`, `.menu`, `.suggestion-container`, `.popover.hover-popover`, `.notice`, `.status-bar`. Enforced by the same test.
- The theme, plugin, `package.json` and `versions.json` carry the same version number. Enforced by the same test.
- The theme paints an opaque base only when `<body>` lacks `is-translucent`. The plugin adds that class only after Windows accepts the material.
- Nothing published (manifests, theme) contains a personal web address. Enforced by the same test.

## Global Side Effects

- Changes the OS window material for Obsidian's main window while the plugin is enabled, and resets it to `none` when the plugin unloads.
- Mutates `<body>`: classes, inline CSS variables and a hidden `<svg>` of filters.
- Writes `data.json` in the plugin's folder through Obsidian's `saveData`, at most once per 600 ms of changes.
- Copy diagnostics writes to the clipboard.

## System Verification

- Run: `cd plugin/vitrine && npm run build && npm test`
- In Obsidian: work through the checklist in [`./plugin/vitrine/README.md`](./plugin/vitrine/README.md#manual-checks).
