# Developing Vitrine

How the plugin fits with the [Vitrine theme](https://github.com/Invictus2076/vitrine-theme), what must stay true, and how to check a release.

## How the two fit together

The theme does all the drawing. This plugin never draws: it works out the look from the chosen preset or Custom values and passes it to the theme, gives each floating panel an SVG filter for blur and refraction, and on Windows asks the OS for an acrylic or Mica window.

Source docs are in [`src/README.md`](./src/README.md).

## The plugin–theme contract (version 2)

The theme sets `--vt-contract: 2` on `<body>`. The plugin warns in its settings tab when the value is missing (theme not active) or different (mismatched versions). The plugin writes:

- `--vt-blur`, `--vt-saturation`, `--vt-radius`;
- per mode, `--vt-dark-window-tint`, `--vt-dark-panel-tint`, `--vt-dark-highlight`, `--vt-dark-ring` and the same four `--vt-light-*` variables;
- the body classes `lg-plugin`, `lg-h1` to `lg-h6`, `lg-inline-title`, `lg-edit`, `lg-read`, `lg-spectrum`;
- `--lg-refract` on each floating panel.

The theme reads every `--vt-*` variable with a fallback equal to the Vitrine preset, so enabling the plugin with default settings changes nothing on screen.

## Invariants

- `build` runs esbuild only after both type checks pass. `tsc` never emits; esbuild is the only thing that writes `main.js`.
- Tests import only pure modules (`glass.ts`, `state.ts`, `css.ts`, `displacement.ts`). Node runs them by stripping types, so those modules must not use constructor parameter properties or enums.
- Anything the host provides (`obsidian`, `electron`, `@electron/remote`) stays in esbuild's `external` list, and `isDesktopOnly` stays true while the plugin uses Electron.
- The panels the plugin filters (`GLASS_SELECTOR` in `src/css.ts`) are the same seven the theme frosts: `.modal`, `.prompt`, `.menu`, `.suggestion-container`, `.popover.hover-popover`, `.notice`, `.status-bar`.
- The manifest has no `authorUrl` or `fundingUrl`. The description is under 250 characters, starts with a verb and ends with a full stop.
- `main.js` and `node_modules/` are git-ignored.

## Releasing

1. Set the same version in `manifest.json`, `package.json` and `versions.json` here, and in the theme's `manifest.json`.
2. `npm run build && npm test`.
3. Do the manual checks below.
4. Create a GitHub release whose tag is exactly the version, and attach `main.js` and `manifest.json`. Do the same in the theme repository, attaching `theme.css` and `manifest.json`.

## Manual checks

Do these in a throwaway vault in Obsidian before each release, and note the Obsidian and Windows versions used.

1. A fresh vault with no `data.json`: the Vitrine preset is selected, and the window shows the wallpaper through it on Windows.
2. Each preset, in dark and in light mode: panels look frosted, text behind the command palette is smeared and readable, and headings show no outline or dark smudge.
3. Move a slider: the preset becomes "Custom (based on …)". Pick another preset and move a slider: a notice says Custom was replaced. Reset to preset works.
4. Each window material (Acrylic, Mica, Mica Alt, Off), and Windows transparency effects off.
5. Panel blur and Refraction switches: off removes the effect, on restores it.
6. Theme without the plugin: the Vitrine look, with glass on H1, H2 and the note title.
7. The plugin with a different theme: the settings tab warns that Vitrine isn't active.
8. Copy diagnostics: the report pastes and names the preset, material status and versions.
9. One bright and one busy wallpaper behind the window.
