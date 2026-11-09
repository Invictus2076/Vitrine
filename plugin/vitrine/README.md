# Vitrine plugin

## Overview

The Obsidian plugin package: its manifest, build setup, source and tests. esbuild bundles `src/main.ts` into one CommonJS `main.js`, which Obsidian loads next to `manifest.json`. The plugin is desktop-only and is meant to run with the Vitrine theme.

## Interface

- Source: [`./src/README.md`](./src/README.md). Presets, saved settings, the plugin–theme contract, refraction, the settings tab, the window material and diagnostics.
- `manifest.json`: id `vitrine`, name `Vitrine`, version `1.1.0`, `minAppVersion` `1.15.0`, `isDesktopOnly: true`. Obsidian 1.15.0 is the only version tested.
- `versions.json`: maps each plugin version to its minimum Obsidian version, as Obsidian's community list expects.
- `esbuild.config.mjs`: entry `src/main.ts`, output `main.js`, format `cjs`, target `es2022`, externals `obsidian`, `electron`, `@electron/remote`, `@codemirror/*`. With the argument `production` it builds once with no source map; with no argument it watches and rebuilds with inline source maps.
- `package.json` scripts:
  - `build`: `npm run typecheck && node esbuild.config.mjs production`
  - `dev`: `node esbuild.config.mjs`
  - `typecheck`: `tsc --noEmit && tsc --noEmit -p tsconfig.test.json`
  - `test`: `node --test test/*.test.ts`
- Tests (`test/`): `displacement.test.ts` (map maths), `glass.test.ts` (preset ranges, floors, clamping, channel scales), `state.test.ts` (loading, migration from version 1, Custom rules) and `contract.test.ts` (theme fallbacks equal the Vitrine preset, same panels, same contract version and versions, no web addresses).
- Development dependencies, pinned exactly: `obsidian` 1.14.4, `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.13, `esbuild` 0.28.2, `typescript` 7.0.2, `@types/node` 24.19.2.

## Invariants

- `build` runs esbuild only after both type checks pass. `dev` skips the type checks.
- `tsc` never emits. esbuild is the only thing that writes `main.js`.
- `tsconfig.json` checks `src` with no Node types. `tsconfig.test.json` checks the tests and the pure modules they import, with Node types.
- Tests import only pure modules (`glass.ts`, `state.ts`, `css.ts`, `displacement.ts`). Node runs them by stripping types, so those modules must not use TypeScript-only syntax such as constructor parameter properties or enums.
- Anything the host provides (`obsidian`, `electron`, `@electron/remote`) stays in esbuild's `external` list, and `isDesktopOnly` stays true while the plugin uses Electron.
- The manifest, `package.json`, `versions.json` and the theme manifest carry the same version. `contract.test.ts` fails otherwise.
- The manifest has no `authorUrl` and no `fundingUrl`. The description is under 250 characters, starts with a verb and ends with a full stop.
- `main.js` and `node_modules/` are git-ignored.

## Side Effects

- `npm run build` writes `main.js`.
- `npm run dev` keeps running and rewrites `main.js` on every source change.
- Type checks and tests write no files. `contract.test.ts` reads `../../theme/Vitrine/theme.css` and both manifests.

## Verification

- Run: `npm run build && npm test`

## Manual checks

Do these in a throwaway vault in Obsidian before each release, and note the Obsidian and Windows versions used.

1. A fresh vault with no `data.json`: the Vitrine preset is selected, and the window shows the wallpaper through it on Windows.
2. Each preset, in dark and in light mode: panels look frosted, text behind the command palette is readable, and headings show no outline or dark smudge.
3. Move a slider: the preset becomes "Custom (based on …)". Pick another preset and move a slider: a notice says Custom was replaced. Reset to preset works.
4. Each window material (Acrylic, Mica, Mica Alt, Off), and Windows transparency effects off.
5. Theme without the plugin: the Vitrine look, with glass on H1, H2 and the note title.
6. The plugin with a different theme: the settings tab warns that Vitrine isn't active.
7. Copy diagnostics: the report pastes and names the preset, material status and versions.
8. One bright and one busy wallpaper behind the window.
