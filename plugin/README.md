# plugin

## Overview

Holds the Obsidian plugin that goes with the Liquid Glass theme. The folder name `liquid-glass` matches the plugin id, so the folder can be copied straight into a vault's `.obsidian/plugins/`.

## Subdirectories & Boundaries

- liquid-glass: [`./liquid-glass/README.md`](./liquid-glass/README.md). The plugin package: manifest, esbuild build into `main.js`, and the TypeScript source that sets the Windows window material, adds refraction to floating panels, and passes settings to the theme as body classes and CSS variables.
