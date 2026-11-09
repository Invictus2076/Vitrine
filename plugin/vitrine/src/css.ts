/**
 * The plugin–theme contract, as data. Pure, no DOM.
 *
 * The plugin writes these variables inline on <body>. The theme reads them with its own fallbacks,
 * and picks the dark or light set inside its .theme-dark / .theme-light blocks, so a mode switch
 * needs nothing from the plugin.
 */
import type { GlassValues, Mode, ModeKey } from "./glass.ts";
import type { HeadingSettings } from "./state.ts";

/** Floating panels that get refraction. The theme's frosted-panel rule lists the same elements. */
export const GLASS_SELECTOR =
  ".modal, .prompt, .menu, .suggestion-container, .popover.hover-popover, .notice, .status-bar";

/** The theme sets --vt-contract to this number. A different number means a mismatched theme and plugin. */
export const CONTRACT_VERSION = 2;

const MODE_VARIABLE: Record<ModeKey, string> = {
  windowTint: "window-tint",
  panelTint: "panel-tint",
  highlight: "highlight",
  ring: "ring",
};

export function glassVariables(values: GlassValues): Record<string, string> {
  const vars: Record<string, string> = {
    "--vt-blur": `${values.blur}px`,
    "--vt-saturation": `${values.saturation}%`,
    "--vt-radius": `${values.radius}px`,
  };
  for (const mode of ["dark", "light"] as Mode[]) {
    for (const [key, name] of Object.entries(MODE_VARIABLE) as [ModeKey, string][]) {
      vars[`--vt-${mode}-${name}`] = `${values[mode][key]}%`;
    }
  }
  return vars;
}

/** Every variable glassVariables can write, for cleanup on unload. */
export const GLASS_VARIABLE_NAMES = Object.keys(
  glassVariables({
    blur: 0, saturation: 0, radius: 0, refraction: 0, bezel: 0, fringe: 0,
    dark: { windowTint: 0, panelTint: 0, highlight: 0, ring: 0 },
    light: { windowTint: 0, panelTint: 0, highlight: 0, ring: 0 },
  }),
);

/** Body classes. `lg-plugin` tells the theme to follow the heading classes instead of its defaults. */
export function headingClasses(headings: HeadingSettings): Record<string, boolean> {
  return {
    "lg-plugin": true,
    "lg-h1": headings.levels[1],
    "lg-h2": headings.levels[2],
    "lg-h3": headings.levels[3],
    "lg-h4": headings.levels[4],
    "lg-h5": headings.levels[5],
    "lg-h6": headings.levels[6],
    "lg-inline-title": headings.noteTitle,
    "lg-edit": headings.inEditingView,
    "lg-read": headings.inReadingView,
    "lg-spectrum": headings.spectrum,
  };
}

export const HEADING_CLASS_NAMES = Object.keys(
  headingClasses({ levels: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }, noteTitle: true, inEditingView: true, inReadingView: true, spectrum: true }),
);
