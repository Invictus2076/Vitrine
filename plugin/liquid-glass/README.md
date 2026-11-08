# Liquid Glass plugin

## Overview

The Obsidian plugin package: its manifest, build setup and source. esbuild bundles `src/main.ts` into a single CommonJS `main.js`, which Obsidian loads next to `manifest.json`. The plugin is desktop-only and is meant to run with the Liquid Glass theme.

## Interface

- Source: [`./src/README.md`](./src/README.md). The `LiquidGlassPlugin` class, refraction, settings and window material.
- `manifest.json`: id `liquid-glass`, name `Liquid Glass`, version `1.0.0`, `minAppVersion` `1.6.0`, `isDesktopOnly: true`.
- `esbuild.config.mjs`: entry `src/main.ts`, output `main.js`, format `cjs`, target `es2022`, externals `obsidian`, `electron`, `@electron/remote`, `@codemirror/*`. Pass the argument `production` for a one-off build with no source map; with no argument it watches and rebuilds with inline source maps.
- `package.json` scripts:
  - `build`: `tsc --noEmit && node esbuild.config.mjs production`
  - `dev`: `node esbuild.config.mjs`
  - `typecheck`: `tsc --noEmit`
  - `test`: `node --test test/*.test.ts`
- Development dependencies, pinned exactly: `obsidian` 1.14.4, `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.13, `esbuild` 0.28.2, `typescript` 7.0.2.

## Invariants

- `build` runs esbuild only after the type check passes. `dev` skips the type check.
- `tsc` never emits. esbuild is the only thing that writes `main.js`, so the module format comes from esbuild (`cjs`), not from `tsconfig.json` (`ESNext`).
- Type checking is strict, including `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride` and `isolatedModules`. Imports name their `.ts` extension.
- `tsconfig.json` includes only `src`, so the files in `test/` are run but never type-checked.
- Anything the host provides (`obsidian`, `electron`, `@electron/remote`) must stay in esbuild's `external` list. Bundling them would break the plugin, and `isDesktopOnly` must stay true while it uses Electron.
- `version` in `manifest.json` and `package.json` must be bumped together; nothing checks this.
- `main.js` and `node_modules/` are git-ignored. `main.js` is a build output and ships only in release packages.

## Side Effects

- `npm run build` writes `main.js`.
- `npm run dev` keeps running and rewrites `main.js` on every source change.
- Type checks and tests write no files.

## Verification

- Run: `npm run build && npm test`
