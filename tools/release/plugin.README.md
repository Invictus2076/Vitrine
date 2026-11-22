# Vitrine plugin

Presets, a translucent window and refracting glass panels for the [Vitrine theme](https://github.com/Invictus2076/vitrine-theme) in Obsidian.

> [!IMPORTANT]
> This plugin needs the **Vitrine theme**, which draws the glass. Install the theme first, then choose it in **Settings → Appearance → Themes**.

> [!NOTE]
> Desktop only. The see-through window needs **Windows 11 22H2 or later** with transparency effects on. Mac and Linux get the glass panels but not the translucent window.

## Features

- **Five presets and one Custom look.** Pick a ready-made look, or move any slider and your changes are saved as Custom.
- **Translucent window.** On Windows, your wallpaper shows through, blurred by the system (Acrylic, Mica or Mica Alt).
- **Blur and refraction on floating panels.** The command palette, modals, menus, popovers, notices and the status bar are frosted, and their edges bend what is behind them.
- **Dark and light mode.** Each has its own tint, highlight and outline.
- **Glass headings.** Choose which headings (H1 to H6 and the note title) get glass lettering, in editing view, reading view or both.
- **Easy on slower computers.** Use the Quiet preset, or switch panel blur and refraction off.

## Install

1. Install and select the [Vitrine theme](https://github.com/Invictus2076/vitrine-theme).
2. Open **Settings → Community plugins**, turn off Restricted mode if it's on, choose **Browse**, search for **Vitrine** and install it.
3. Enable **Vitrine**, and restart Obsidian.
4. On Windows, set **Settings → Appearance → Window frame style** to **Hidden** or **Obsidian frame**.

To install by hand, download `main.js` and `manifest.json` from the [latest release](https://github.com/Invictus2076/vitrine-plugin/releases/latest) into `.obsidian/plugins/vitrine/` in your vault, then enable the plugin.

## Presets

Pick one in **Settings → Vitrine → Preset**.

| Preset | Look |
|---|---|
| **Vitrine** (default) | Balanced glass: clear window, frosted panels with a bright top edge and a light prism fringe. |
| **Clear** | The most see-through: little blur, strong edge bending and bright highlights. Inspired by Apple's Liquid Glass. |
| **Frosted** | Heavy blur and solid panels with no bending. Calm and very readable. Inspired by Windows acrylic. |
| **Soft** | Medium blur, a thin light outline and gentle bending. Inspired by web glassmorphism. |
| **Quiet** | Light blur and no bending. The cheapest look to draw, for slower computers. |

### Custom look

Turn on **Show advanced settings** to fine-tune a preset. The first slider you move saves your changes as **Custom (based on …)**.

- There is one Custom slot. If you start from a different preset and move a slider, it replaces the old Custom, and a notice tells you.
- **Reset to preset** goes back to the preset your Custom started from. Custom stays in the list.

## Settings

| Setting | What it does |
|---|---|
| **Preset** | One of the five looks above, or your Custom look |
| **Panel blur** | Blur behind floating panels (the wallpaper blur is set by Windows) |
| **Saturation** | How much colour comes through floating panels |
| **Corner radius** | Rounding of large panels; menus and tabs follow it |
| **Strength, Edge width, Colour fringe** | How strongly, how wide and with how much prism split panel edges bend what is behind them |
| **Window tint** | How much of the base colour covers the window background. Set separately for dark and light |
| **Panel tint** | How solid floating panels are. Set separately for dark and light, with a minimum that keeps text readable |
| **Edge highlight, Edge ring** | The light line along the top of panels and the thin outline around them. Set separately for dark and light |
| **Window material** | Windows only: Acrylic (blurred wallpaper, default), Mica, Mica Alt or Off |
| **Panel blur** (under Performance) | Switches the blur behind panels off for slower computers, whatever the preset says. On by default in every preset |
| **Refraction** (under Performance) | Switches refraction off for slower computers, whatever the preset says |
| **Heading 1–6, Note title, In editing view, In reading view** | Which headings get glass lettering, and where |
| **Colour in the glass** | Tints glass headings with a cyan-to-orange spectrum |

The mode-specific sliders edit the values of whichever mode Obsidian is in.

## Commands

| Command | What it does |
|---|---|
| **Vitrine: Copy diagnostics** | Copies a short report about your setup for bug reports. Nothing is sent anywhere. Also a button in the settings tab. |

## Limits

- The translucent window needs Windows 11 22H2 or later with **transparency effects** on. Windows draws a solid colour instead when transparency effects or battery saver are on, and Vitrine can't detect that.
- Windows does the wallpaper blur, so its strength can't be changed. Refraction bends what is inside the window, not the wallpaper.
- Mac and Linux get the presets and refraction, but no window material. Pop-out windows and the Settings window stay solid and get no refraction.
- Don't run it alongside other plugins that set the window material, such as Pseudo Mica or Translucent BG.
- Only Obsidian 1.15.0 has been tested.

## Troubleshooting

- **The window is solid, not see-through.** Check that Windows transparency effects are on and battery saver is off, and that **Window material** isn't set to Off. The settings tab shows a warning if Windows refused the material.
- **The settings tab says Vitrine isn't active.** Select **Vitrine** under **Settings → Appearance → Themes**. The plugin needs the theme to draw anything.
- **Text behind a panel shows through sharp.** Check that **Panel blur** is on under Performance. If it is, run **Copy diagnostics** and include the report in a bug report.
- **Text is hard to read on a bright wallpaper.** Raise **Window tint** and **Panel tint**, or pick Frosted.
- **Something looks wrong after an Obsidian update.** Run **Copy diagnostics** and paste the report into your bug report.

## Building

```bash
npm install
npm run build   # type checks, then writes main.js
npm test        # runs the tests
npm run dev     # rebuilds on every change
```

How it fits with the theme, and the checks to do before a release, are in [DEVELOPING.md](./DEVELOPING.md).

## Acknowledgements

Setting the window material through Electron follows the approach of [Pseudo Mica](https://community.obsidian.md/plugins/pseudo-mica).

## License

[MIT](./LICENSE)
