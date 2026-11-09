# Vitrine: rename, presets and glass settings

* **Author:** Siddharth Singh Khati
* **Date:** 2026-11-09

## Overview

Vitrine is an Obsidian theme with a companion plugin. Together they give Obsidian frosted, refracting glass. On Windows the plugin also turns on the acrylic window material, so the desktop wallpaper shows blurred behind the window. Today the project is called "Liquid Glass" and has a short settings tab.

This brief covers the next version:

- Rename everything people see to **Vitrine**.
- Add **presets**: a few built-in glass looks, plus one **Custom** slot that is saved automatically when someone picks a preset and then moves a slider.
- Expose the **glass values** of the original design as settings, in dark and light mode: blur, saturation, tints, edge highlights, edge ring, corner radius, refraction strength, bezel width and colour fringe.
- **Retune the defaults**, fix the **glass headings**, and correct the **docs**.

The audience is anyone who installs the theme and plugin, not just the author. Light mode is required. Mac, Linux and mobile get no new features but must not break or show settings that do nothing there.

Two facts shape everything below.

- **Nothing has been distributed.** The project has no GitHub repository and no release, so nobody else has an install to migrate. The only installs are the author's local repo and a throwaway test vault.
- **The current version was tested in real Obsidian** on 2026-11-09 (Obsidian 1.15.0, Electron 43, Windows 11 23H2, transparency effects on). Theme and plugin load. Acrylic applies. The command palette and status bar get the frosted glass and refraction. Light mode renders. But with the default 58% black window tint the window looks almost solid black; the acrylic only shows at 0% tint. The glass headings look outlined with a dark smudge. The active tab ignores the theme's 10px corner radius and shows 4px.

## Analysis

Seven reviewers looked at the concept separately, each from one angle: design, codebase details, the bigger picture, how easy it is to understand, readiness to build, long-term structure, and contradictions in the idea. They agreed on most points.

### The settings model can't carry presets yet

This came up in every review. Today the plugin saves a flat copy of every value and merges it over the defaults when it loads. Once someone changes any setting, every value is frozen in their saved file. A retuned default, such as fixing the 58% tint, never reaches them, and neither does a later fix to a built-in preset. The merge also only goes one level deep, so new nested dark/light values from an older file would come out as `undefined` and end up in the CSS as `undefined%`. Values are never range-checked when loaded.

The fix is to save **which preset is active** (by id), not the numbers it produced, plus the Custom slot when there is one. The actual values are worked out from the presets in the code each time the plugin loads. A `schemaVersion` field and a migration step turn the old flat format into the new one. A deep, schema-driven merge fills in missing fields, and every number is clamped to its slider range. All of this is pure logic, so it can be unit-tested the same way the displacement maths already is.

### Dark and light values can't travel the way values travel today

The plugin sets its CSS variables directly on `<body>` as inline styles. Obsidian puts the `.theme-dark` / `.theme-light` class on that same `<body>`, and an inline style beats both class rules. So one variable can't hold a dark value and a light value.

Two designs were weighed:

- **Mode-named variables (chosen).** The plugin writes, for example, `--vt-dark-window-tint` and `--vt-light-window-tint`. The theme picks the right one inside its `.theme-dark` and `.theme-light` blocks, with its own default as the fallback: `var(--vt-dark-window-tint, 18%)`. There is no runtime state to go stale, and the theme still works with no plugin.
- **The plugin listens for mode changes and rewrites the variables.** This was set aside: if the plugin misses a mode switch, light mode silently shows dark values.

Several reviewers questioned whether every value needs a dark/light pair. Blur, saturation, corner radius and the refraction values are geometry or optics; they don't plausibly differ between modes. Only the colour and opacity values do: window tint, panel tint, top and bottom edge highlights, and the edge ring. Pairing only those keeps the settings tab at about 14 controls instead of 26.

### Contradiction 1: see-through versus readable

One value, the window tint, decides both how much wallpaper shows and how readable text is. It is also the same for every window material. The test showed that Windows already darkens acrylic before the plugin's tint is added, so the slider fights the OS rather than tuning the look.

The structural review found a second cause. The theme paints its own extra dark layer over the editor area (14% black in dark mode) and a faint layer over the sidebars. These stack on top of the window tint. Lowering the default without removing that stacking would leave a 0–95% slider where only the bottom few percent are usable.

The resolution:

1. Find out in the test vault exactly which layers paint over the acrylic.
2. Fold the editor and sidebar layers into the tint math.
3. Pick defaults so acrylic is clearly visible the first time someone enables the plugin.
4. Give each mode a **readability floor**, a minimum panel tint the preset and Custom values can't go below. This protects text on bright or busy wallpapers the author hasn't tested.

Ideal result: the wallpaper shows as much as the OS material allows, and body text always sits on a surface that's readable.

Light mode needs its own check. Windows tints acrylic according to the Windows app theme, not Obsidian's mode, so Obsidian light on Windows dark may look grey whatever the slider says. Light defaults can't be chosen until light mode is tested at 0% tint.

### Contradiction 2: more control versus states anyone can test

About 14 values × 2 modes × 4 window materials is far too many combinations to check by hand in a real vault. Presets resolve this. They are the main control and the tested surface. The individual values sit under a **Show advanced** switch. One pure function turns "preset + Custom" into final values and enforces the clamps and readability floors.

What gets tested:

- every preset × dark/light × material;
- each slider at its minimum and maximum, with everything else at its default.

Not the full cross-product.

### Contradiction 3: glass lettering with depth versus clean letters

The test showed the outline and smudge, and three reviewers traced them to the same two lines of the theme:

- A 0.6px text stroke draws a solid ring around transparent letters. That ring is the outline.
- A drop shadow of 20px blur at 50% black, applied to see-through letters, shows through them. It reads as a dark smudge rather than depth.

The resolution is to carry the glass look in the gradient fill, which already has a bright top, a clear middle and light at the base:

- Drop the stroke, or reduce it to a faint light highlight.
- Keep only the 1px light offset shadow, for an etched edge.

Acceptance check: no visible outline at 100% zoom and no dark area in or behind the letters, in both modes, in Live Preview, source mode, reading view and the note title, with the plugin on and off. Judge it on the real screen, not only from a page capture.

### The Custom slot

The author's rule is that picking a preset and then moving a slider saves a **Custom** look, and there is only one Custom slot. Reviewers found these gaps:

- **Silent loss.** Someone who tuned Custom, tries preset B to compare, and nudges a slider loses their old Custom without a warning.
- **Undefined starting state.** It isn't defined what is selected on a fresh install, whether choosing Custom again restores it, or what happens to the mode not being edited.
- **The tab can break mid-drag.** If the code redraws the whole settings tab to switch the dropdown to "Custom", it destroys the slider while it is being dragged.

Decisions taken here:

- **Custom is a full copy of every value for both modes.** It is not a "difference from a preset", so a later retune never shifts someone's Custom look under them.
- **When a slider first moves on a preset,** Custom is filled from that preset, and the label reads "Custom (based on Frosted)".
- **If an older Custom gets replaced,** a short notice says so. A **Reset to preset** button returns to the base preset.
- **The dropdown changes in place,** never by redrawing the tab.
- **Saves are debounced.** The look updates live while dragging, and the file is written after the drag ends.

### Refraction settings need code changes, not just sliders

- **Bezel width** is fixed in code. Built maps are cached by panel size only, and a panel isn't redrawn unless its size changes. A bezel slider would do nothing to open panels and keep serving stale maps. Fix: put the bezel width in the cache key, and add one `setOptions` call that clears the cache and redraws every tracked panel. Throttle the redraws, or apply them when the drag ends, because each one draws and encodes a PNG.
- **The red/green/blue split** is three fixed multipliers on the strength. Three more sliders would describe the same numbers twice. Fix: one **Colour fringe** value that spreads the three channels apart.
- **The strength text is wrong.** It said "Displacement at the edge in pixels" and quoted the original design's value. The SVG filter shifts by strength × (value − 0.5), so strength 30 moves the edge about 15px. It also talked to the author rather than to users.

Refraction values are shared by both modes, which avoids the mode-switch problem above.

### Presets: what they contain and what they're called

Presets cover glass values only. They don't change the window material, which stays its own Windows-only setting, or the heading toggles. A preset named "Mica" that leaves the window on acrylic would confuse people, and one that silently changes an OS setting would surprise them.

Names describe the look and don't borrow Apple or Microsoft product names. Each preset's description says what inspired it. Starting values, from the original design and three outside references:

| Preset | Inspired by | Panel blur | Saturation | Window tint (dark / light) | Panel tint (dark / light) | Refraction | Corner radius | Notes |
|---|---|---|---|---|---|---|---|---|
| **Vitrine** (default) | the original design | 24px | 180% | low, set from testing | 74% / 74% | 30, fringe on | 18px | the site's highlight, ring and shadow |
| **Clear** | Apple's Liquid Glass; `liquid-glass-react` defaults (displacement 70, saturation 140%, aberration 2) | 6px | 140% | lowest | 45% / 55% (floor) | 60, stronger fringe | 24px | bright top highlight; most see-through |
| **Frosted** | Windows acrylic recipe: blur, tint and noise layers | 40px | 120% | medium | 85% / 85% | off | 12px | flat and calm; optional fine grain |
| **Soft** | common CSS glassmorphism: about 16px blur, 1px white border at about 20% | 16px | 150% | low | 60% / 65% | 15, fringe off | 16px | thin light ring, soft shadow |
| **Quiet** | low-cost option | 8px | 100% | medium | 85% / 90% | off | 12px | for slower machines; the cheapest to draw |

All numbers are starting points. Each one is set or checked in the test vault, in both modes and over a bright and a busy wallpaper, before release. Frosted's grain is the only new visual layer; it is optional and can be dropped.

### Rename

"Liquid Glass" lives at four levels:

- the display name;
- the plugin id (`liquid-glass`), which also sets the plugin folder and where settings are saved;
- the theme folder, which is how Obsidian remembers the chosen theme;
- the internal `lg-` prefix on the body classes and CSS variables.

Because nothing has been distributed, the rename costs almost nothing now and will cost a migration later. The display name, plugin id and theme folder all change to Vitrine in one commit, together with the 47 places in 11 files that use the old name. The internal `lg-` prefix stays, since users never see it and renaming it brings no benefit. New variables use `--vt-`.

The author's own test vault gets the old plugin removed by hand. There is no in-code import of old settings, because there's nobody to import for. If a build ever goes out before this lands, that decision is revisited.

### Making problems diagnosable on other people's machines

The plugin can report almost nothing about itself today. The only signal is the material status, and "on" just means the Windows call didn't throw an error. The test showed "on" with a window that looks solid. People installing this won't open the developer console.

So the brief adds:

- **A "Copy diagnostics" button and command.** It copies a local, plain-text report: versions; material status, and whether Windows' "Transparency effects" setting is on; the active preset or Custom and its base; the values in use for each mode; and the computed style of one panel and the active tab. Nothing is sent anywhere.
- **A warning in the settings tab when the Vitrine theme isn't active.** The plugin reads a theme-only variable, and an empty value means the theme is missing.
- **A contract version.** The theme sets `--vt-contract`, and the plugin warns when it doesn't match its own, so a mismatched theme and plugin pair is visible instead of silently doing nothing.

### Smaller items found

- **Tab corner radius.** The active tab ignores `--tab-radius-active: 10px` and shows 4px. Find which element and property Obsidian really reads in the test vault before changing it. Don't add a blunt override.
- **Window colour.** The Electron window's own background colour reads `#000000`. Test whether setting it transparent changes how much acrylic shows, separately from the tint.
- **Defaults in two places.** The rule that the theme's defaults equal the plugin's defaults is copied by hand. It becomes "the theme's fallbacks equal the **Vitrine** preset", enforced by a unit test that reads the theme file.
- **Wording.** Settings text talked to the author about the original design. It is rewritten for other people, and every value gets a unit and a one-line description of what it changes on screen. "Blur" becomes "Panel blur", and the text says the wallpaper blur is set by Windows and can't be adjusted.
- **Other operating systems.** On Mac and Linux the window controls (material, window tint) are hidden, with one line explaining why, as the material dropdown already is.
- **Out-of-date docs.** The README says the plugin was "not yet tested in Obsidian itself", which is now false. The install step mentions a release zip that doesn't exist. The test files run but aren't type-checked.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Rename the display name, plugin id and theme folder to Vitrine, with all docs, manifests and strings in one change.
  * Retune the window and panel defaults so acrylic is visible on first enable, after finding and folding in the stacked editor and sidebar layers. Check light mode at 0% tint.
  * Fix the glass headings against the acceptance check above.
  * Five built-in presets (Vitrine, Clear, Frosted, Soft, Quiet) and one Custom slot, following the rules in "The Custom slot".
  * An advanced section for panel blur, saturation, corner radius, refraction strength, bezel width and colour fringe (shared between modes), and window tint, panel tint, edge highlights and edge ring (separate for dark and light). The settings tab edits the mode Obsidian is currently in and labels it.
  * A new settings format with `schemaVersion`, migration from the current flat format, a deep merge and clamping, and readability floors.
  * Mode-named CSS variables for the dark/light values, and a contract version.
  * Refraction options that redraw open panels correctly, with throttled rebuilds.
  * Debounced saves.
  * Copy diagnostics, plus warnings when the theme is missing or the contract doesn't match.
  * Unit tests: preset resolution, Custom transitions, migration, clamping, and a check that the theme's defaults match the Vitrine preset. Make the tests type-checked.
  * A written checklist for real Obsidian:
    - fresh vault
    - dark and light
    - each preset
    - each material, and transparency effects off
    - theme without the plugin
    - one bright and one busy wallpaper
  * Correct all three READMEs and the settings text.
* **Out-of-Scope Non-Goals:**
  * New features on Mac, Linux or mobile. They only have to not break or mislead.
  * Presets that change the window material or the heading toggles.
  * More than one Custom slot, user-named presets, or import/export of looks.
  * Integration with the Style Settings plugin.
  * Renaming the internal `lg-` prefix.
  * Importing settings from an old `liquid-glass` install.
  * Any network calls or telemetry.
  * Publishing to GitHub or Obsidian's community list. The author decides when.

## Alternatives Weighed

* **Separate dark and light values for all 13 settings (26 sliders).** Set aside in review: blur, saturation, radius and the refraction values don't differ by mode, and doubling them doubles the variables, tests and docs.
* **The plugin rewrites the variables when the mode changes.** Set aside in review in favour of mode-named variables picked by the theme: a missed mode switch would show the wrong values with nothing to reveal it.
* **Custom stored as "differences from its preset".** Set aside in review: it lets retuned presets reach Custom users, but it also changes someone's look under them without their doing anything. A full copy was chosen.
* **No stored Custom: show "Custom" whenever the values match no preset.** Set aside: the author asked for a saved Custom slot.
* **Presets named after platforms ("Liquid Glass", "Acrylic", "Mica") that also switch the window material.** Set aside in review: it borrows other companies' product names, and it conflicts with the existing material setting and with Mac and Linux.
* **Settings through the Style Settings plugin instead of the plugin's own tab.** Set aside: the plugin is already needed for the window material, and Style Settings would ask users to install a third thing. The cost is that people using the theme alone get fixed defaults and no controls.
* **Three separate red, green and blue refraction sliders.** Set aside in review: they overlap with refraction strength. One colour-fringe value replaces them.
* **Ship only the rename, retuned defaults and the heading fix, and leave presets for later.** Raised by the big-picture review, because the visible problem is mostly a defaults problem. The author asked for presets, so they stay in scope, but the build order below starts with these smaller fixes.
* **Retune the default tint and stop there.** Set aside in review: the editor and sidebar layers stacking under the tint would still make most of the slider's range unusable.

## Key Decisions & Staging for Next Steps

1. **Build order.** Each step is checked in the test vault before the next:
   1. Rename to Vitrine.
   2. Find the stacked layers, retune the defaults, test light mode at 0% tint and the window colour.
   3. Fix the headings and the tab radius.
   4. The new settings format, presets and Custom, with unit tests first.
   5. Advanced settings and refraction options.
   6. Diagnostics and warnings.
   7. Docs.
2. **Presets are saved by id**, and their values are worked out at load time. Custom is a full copy for both modes, labelled with the preset it was based on.
3. **Dark and light are paired only for the colour and opacity values.** They travel as mode-named `--vt-` variables. Everything else is shared between modes.
4. **Presets contain glass values only.**
5. **Readability floors** are enforced in one pure function that every value passes through.
6. **The theme's fallbacks must equal the Vitrine preset.** A unit test enforces this.
7. **Open questions for the author:**
   - whether an old Custom being replaced deserves a warning, or only a notice afterwards;
   - whether the Frosted grain layer is wanted;
   - final preset values, after the test-vault pass.
