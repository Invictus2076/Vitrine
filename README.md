# Vitrine Blueprint

Vitrine gives Obsidian frosted, refracting glass. It comes as a theme and a companion plugin. The theme draws everything and works on its own. The plugin adds presets and settings, refraction on floating panels and, on Windows, a translucent window that shows the desktop wallpaper blurred behind Obsidian.

## Install

Vitrine isn't in Obsidian's community lists yet, so it is installed by hand.

1. Open your vault folder, then the hidden `.obsidian` folder inside it.
2. Copy `theme/Vitrine` into `.obsidian/themes/`, so you have `.obsidian/themes/Vitrine/theme.css`.
3. Build the plugin: in `plugin/vitrine`, run `npm install`, then `npm run build`. Copy `manifest.json` and `main.js` from there into `.obsidian/plugins/vitrine/`.
4. In Obsidian, open **Settings → Appearance**:
   - set **Themes** to **Vitrine**;
   - choose dark or light; both are supported;
   - on Windows, set **Window frame style** to **Hidden** or **Obsidian frame**.
5. In **Settings → Community plugins**, turn off Restricted mode if it's on, then enable **Vitrine**.
6. Restart Obsidian.

## Presets

Pick one in **Settings → Vitrine → Preset**.

| Preset | Look |
|---|---|
| Vitrine (default) | Balanced glass: clear window, frosted panels with a bright top edge and a light prism fringe. |
| Clear | The most see-through: little blur, strong edge bending and bright highlights. Inspired by Apple's Liquid Glass. |
| Frosted | Heavy blur and solid panels with no bending. Calm and very readable. Inspired by Windows acrylic. |
| Soft | Medium blur, a thin light outline and gentle bending. Inspired by web glassmorphism. |
| Quiet | Light blur and no bending. The cheapest look to draw, for slower computers. |

Turn on **Show advanced settings** to fine-tune a preset. The first slider you move saves your changes as **Custom (based on …)**. There is one Custom slot: starting from a different preset and moving a slider replaces it, and a notice says so. **Reset to preset** returns to the preset Custom started from, and Custom stays in the list.

## Settings

| Setting | What it does |
|---|---|
| Preset | One of the five looks above, or your Custom look |
| Panel blur | Blur behind floating panels (the wallpaper blur is set by Windows) |
| Saturation | How much colour comes through floating panels |
| Corner radius | Rounding of large panels; menus and tabs follow it |
| Refraction, Edge width, Colour fringe | How strongly, how wide and with how much prism split panel edges bend what is behind them |
| Window tint | How much of the base colour covers the window background. Set separately for dark and light |
| Panel tint | How solid floating panels are. Set separately for dark and light, with a minimum that keeps text readable |
| Edge highlight, Edge ring | The light line along the top of panels and the thin outline around them. Set separately for dark and light |
| Window material | Windows only: Acrylic (blurred wallpaper, default), Mica, Mica Alt or Off |
| Refraction (Performance) | Switches refraction off for slower computers, whatever the preset says |
| Heading 1–6, Note title, In editing view, In reading view | Which headings get glass lettering, and where |
| Colour in the glass | Tints glass headings with a cyan-to-orange spectrum |
| Copy diagnostics | Copies a short report about your setup for bug reports. Also a command. Nothing is sent anywhere |

The settings tab edits the dark or light values of whichever mode Obsidian is in.

## Limits

- The translucent window needs Windows 11 22H2 or later with **transparency effects** on. Windows draws a solid colour instead when transparency effects or battery saver are on, and Vitrine can't detect that.
- Windows does the wallpaper blur, so its strength can't be changed. Refraction bends what is inside the window, not the wallpaper.
- Mac and Linux get the theme, presets and refraction, but no window material. Pop-out windows stay solid and get no refraction.
- Without the plugin, the theme uses the Vitrine preset's look with glass on H1, H2 and the note title.
- Don't run it alongside other plugins that set the window material, such as Pseudo Mica or Translucent BG.
- If something looks off after an Obsidian update, use **Copy diagnostics** and include the report in your bug report.

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
