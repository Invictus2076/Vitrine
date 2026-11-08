# Liquid Glass for Obsidian Blueprint

A theme and companion plugin that bring the glass from siddharthkhati.pages.dev to Obsidian on Windows.

## System Overview

Two parts that Obsidian loads separately, joined by CSS:

- **Theme** (`theme/Liquid Glass/theme.css`) does all the drawing. It makes Obsidian's panes clear over one tinted base, frosts the floating panels, and fills headings with a glass gradient. Wherever Obsidian documents a variable for a surface (`--modal-background`, `--status-bar-background`, `--workspace-background-translucent`, the tab and ribbon variables), it sets the variable rather than overriding the element.
- **Plugin** (`plugin/liquid-glass`) never draws. On Windows it asks the OS for an acrylic or Mica material, so the wallpaper shows through the window. It gives each floating panel an SVG displacement filter for refraction, and passes the user's settings to the theme as body classes and CSS variables.

The theme works without the plugin. The window then stays solid, and H1, H2 and the note title are glass in both views.

## Install

1. Open your vault folder, then the hidden `.obsidian` folder inside it.
2. Copy `theme/Liquid Glass` into `.obsidian/themes/`, so you have `.obsidian/themes/Liquid Glass/theme.css`.
3. Copy `manifest.json` and `main.js` from `plugin/liquid-glass` into `.obsidian/plugins/liquid-glass/`. The release zip already has a built `main.js`. From source, run `npm install && npm run build` in `plugin/liquid-glass` first.
4. In Obsidian, go to **Settings → Appearance**:
   - set **Themes** to **Liquid Glass**;
   - set **Base color scheme** to **Dark** (light works too);
   - set **Window frame style** to **Hidden** or **Obsidian frame**. If the window stays solid, try **Native frame**; reports differ on which one acrylic needs.
5. **Settings → Community plugins**: turn off Restricted mode if it's on, then enable **Liquid Glass**.
6. Restart Obsidian.

## Settings (Settings → Liquid Glass)

| Setting | What it does |
|---|---|
| Window material | Acrylic (blurred wallpaper, default), Mica, Mica Alt, or Off. Windows only. |
| Window tint | How much of the base colour covers the wallpaper |
| Panel tint | Opacity of the command palette, modals, menus, popovers, notices and status bar |
| Blur | Blur radius behind floating panels |
| Refraction | Edge refraction on floating panels |
| Refraction strength | Displacement at the edge in pixels (your site uses 30) |
| Heading 1–6 | Which heading levels get glass lettering |
| Note title | Glass on the inline title |
| In editing view / In reading view | Where glass headings apply |
| Colour in the glass | Tints glass headings with your site's fluid colours |

## Subdirectories & System Boundaries

- plugin: [`./plugin/README.md`](./plugin/README.md). Holds the plugin package, `liquid-glass`: the Windows window material, refraction on floating panels, and settings passed to the theme.
- theme/Liquid Glass: `theme.css` and `manifest.json`. No contract file, because EGM bootstrap documents code directories and treats CSS as non-code. Its side of the plugin contract is listed under Global Invariants.

## Global Invariants

- **Plugin–theme contract.** The plugin writes and the theme reads:
  - the body classes `lg-plugin`, `lg-h1` to `lg-h6`, `lg-inline-title`, `lg-edit`, `lg-read`, `lg-spectrum`;
  - the body variables `--lg-window-tint`, `--lg-float-tint`, `--lg-blur`;
  - `--lg-refract` on each floating panel.

  Rename one side and you must rename the other.
- The theme's frosted-panel selector and the plugin's `GLASS_SELECTOR` list the same seven panels: `.modal`, `.prompt`, `.menu`, `.suggestion-container`, `.popover.hover-popover`, `.notice`, `.status-bar`.
- The theme's defaults (58% window tint, 74% panel tint, 24 px blur; glass on H1, H2 and the note title) match the plugin's `DEFAULT_SETTINGS`, so enabling the plugin changes nothing until a setting is changed.
- The theme paints an opaque base only when `<body>` lacks `is-translucent`. The plugin adds that class only after Windows accepts the material.
- Desktop only. The plugin needs Electron's `BrowserWindow.setBackgroundMaterial`, which needs Windows 11 22H2 or later for acrylic and Mica.

## Global Side Effects

- Changes the OS window material for Obsidian's main window while the plugin is enabled, and resets it to `none` when the plugin unloads.
- Mutates `<body>`: classes, inline CSS variables, and a hidden `<svg>` of filters. Writes `.obsidian/plugins/liquid-glass/data.json` through Obsidian's `saveData`.

## Limits

- Windows does the wallpaper blur, so its strength isn't adjustable, and refraction can't bend the wallpaper; it bends what's inside the window.
- Pop-out windows stay solid and get no refraction.
- Obsidian's class names shift between releases. If something looks off after an update, open the developer console (Ctrl+Shift+I), inspect the element and adjust the matching rule in `theme.css`.
- Don't run alongside Pseudo Mica or Translucent BG; they set the same window material.
- Tested in Chromium against a mock of Obsidian's layout, not yet in Obsidian itself.

## System Verification

- Run: `cd plugin/liquid-glass && npm run build && npm test`
