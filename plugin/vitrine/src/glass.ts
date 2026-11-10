/**
 * The glass values, their limits and the built-in presets. Pure data, no DOM.
 *
 * Shared values are the same in dark and light mode (geometry and optics).
 * Mode values are colours and opacities, which need different numbers on a dark and a light base.
 */

export interface ModeValues {
  /** Percentage of the base colour laid over the window background (the wallpaper, on Windows). */
  windowTint: number;
  /** Percentage of the surface colour in floating panels. */
  panelTint: number;
  /** Opacity of the bright line along the top edge of a panel, in percent. The bottom line is a third of it. */
  highlight: number;
  /** Opacity of the thin ring around a panel, in percent. */
  ring: number;
}

export interface GlassValues {
  /** Blur behind floating panels, in px. */
  blur: number;
  /** Colour saturation behind floating panels, in percent. */
  saturation: number;
  /** Corner radius of large panels, in px. Small panels and tabs are derived from it. */
  radius: number;
  /** feDisplacementMap scale. The edge moves by about half this many px. 0 turns refraction off. */
  refraction: number;
  /** Width of the bending band along each edge, in px. */
  bezel: number;
  /** How far the red, green and blue channels spread apart, in percent of the strength. */
  fringe: number;
  dark: ModeValues;
  light: ModeValues;
}

export type Mode = "dark" | "light";
export type SharedKey = Exclude<keyof GlassValues, Mode>;
export type ModeKey = keyof ModeValues;

export interface FieldSpec {
  name: string;
  desc: string;
  unit: string;
  min: number;
  max: number;
}

export const SHARED_FIELDS: Record<SharedKey, FieldSpec> = {
  blur: { name: "Panel blur", desc: "How strongly floating panels blur what is behind them. The wallpaper blur is set by Windows and can't be changed.", unit: "px", min: 0, max: 40 },
  saturation: { name: "Saturation", desc: "How much colour comes through floating panels. 100% leaves colours unchanged.", unit: "%", min: 100, max: 200 },
  radius: { name: "Corner radius", desc: "Rounding of large panels such as the command palette. Menus and tabs follow it.", unit: "px", min: 0, max: 28 },
  refraction: { name: "Strength", desc: "How strongly panel edges bend what is behind them. The edge moves by about half this value in pixels. 0 turns it off.", unit: "", min: 0, max: 80 },
  bezel: { name: "Edge width", desc: "Width of the band along each panel edge that bends.", unit: "px", min: 4, max: 40 },
  fringe: { name: "Colour fringe", desc: "Splits red, green and blue at the bent edge, like a prism. 0 keeps the colours together.", unit: "%", min: 0, max: 30 },
};

export const MODE_FIELDS: Record<ModeKey, FieldSpec> = {
  windowTint: { name: "Window tint", desc: "How much of the base colour covers the window background. Lower shows more wallpaper; higher is easier to read.", unit: "%", min: 0, max: 95 },
  panelTint: { name: "Panel tint", desc: "How solid floating panels are: the command palette, modals, menus, popovers, notices and the status bar.", unit: "%", min: 30, max: 95 },
  highlight: { name: "Edge highlight", desc: "Brightness of the light line along the top edge of panels.", unit: "%", min: 0, max: 100 },
  ring: { name: "Edge ring", desc: "Strength of the thin outline around panels.", unit: "%", min: 0, max: 40 },
};

/**
 * Lowest values any preset or Custom look can reach, so text stays readable on bright or busy wallpapers.
 * Sliders show their full range; the floor is applied when the look is resolved.
 */
export const READABILITY_FLOORS: Record<Mode, Partial<ModeValues>> = {
  dark: { panelTint: 45 },
  light: { panelTint: 55, windowTint: 35 },
};

export const PRESET_IDS = ["vitrine", "clear", "frosted", "soft", "quiet"] as const;
export type PresetId = (typeof PRESET_IDS)[number];
export const DEFAULT_PRESET: PresetId = "vitrine";

export interface Preset {
  name: string;
  desc: string;
  values: GlassValues;
}

export const PRESETS: Record<PresetId, Preset> = {
  vitrine: {
    name: "Vitrine",
    desc: "Balanced glass: clear window, frosted panels with a bright top edge and a light prism fringe.",
    values: {
      blur: 24, saturation: 180, radius: 18, refraction: 30, bezel: 22, fringe: 10,
      dark: { windowTint: 18, panelTint: 74, highlight: 22, ring: 10 },
      light: { windowTint: 70, panelTint: 74, highlight: 85, ring: 10 },
    },
  },
  clear: {
    name: "Clear",
    desc: "The most see-through: little blur, strong edge bending and bright highlights. Inspired by Apple's Liquid Glass.",
    values: {
      blur: 6, saturation: 140, radius: 24, refraction: 60, bezel: 26, fringe: 18,
      dark: { windowTint: 8, panelTint: 45, highlight: 40, ring: 14 },
      light: { windowTint: 45, panelTint: 55, highlight: 95, ring: 12 },
    },
  },
  frosted: {
    name: "Frosted",
    desc: "Heavy blur and solid panels with no bending. Calm and very readable. Inspired by Windows acrylic.",
    values: {
      blur: 40, saturation: 120, radius: 12, refraction: 0, bezel: 22, fringe: 0,
      dark: { windowTint: 30, panelTint: 85, highlight: 12, ring: 8 },
      light: { windowTint: 65, panelTint: 85, highlight: 60, ring: 8 },
    },
  },
  soft: {
    name: "Soft",
    desc: "Medium blur, a thin light outline and gentle bending. Inspired by web glassmorphism.",
    values: {
      blur: 16, saturation: 150, radius: 16, refraction: 15, bezel: 18, fringe: 0,
      dark: { windowTint: 15, panelTint: 60, highlight: 30, ring: 20 },
      light: { windowTint: 50, panelTint: 65, highlight: 80, ring: 18 },
    },
  },
  quiet: {
    name: "Quiet",
    desc: "Light blur and no bending. The cheapest look to draw, for slower computers.",
    values: {
      blur: 8, saturation: 100, radius: 12, refraction: 0, bezel: 22, fringe: 0,
      dark: { windowTint: 35, panelTint: 85, highlight: 10, ring: 8 },
      light: { windowTint: 70, panelTint: 90, highlight: 50, ring: 8 },
    },
  },
};

export function cloneValues(values: GlassValues): GlassValues {
  return { ...values, dark: { ...values.dark }, light: { ...values.light } };
}

export function clamp(value: unknown, spec: FieldSpec, fallback: number): number {
  const n = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(spec.max, Math.max(spec.min, Math.round(n)));
}

/** Fills missing fields from `fallback` and clamps every number to its range. */
export function sanitizeValues(raw: unknown, fallback: GlassValues): GlassValues {
  const data = (raw ?? {}) as Partial<Record<keyof GlassValues, unknown>>;
  const out = cloneValues(fallback);
  for (const key of Object.keys(SHARED_FIELDS) as SharedKey[]) {
    out[key] = clamp(data[key], SHARED_FIELDS[key], fallback[key]);
  }
  for (const mode of ["dark", "light"] as const) {
    const modeData = (data[mode] ?? {}) as Partial<Record<ModeKey, unknown>>;
    for (const key of Object.keys(MODE_FIELDS) as ModeKey[]) {
      out[mode][key] = clamp(modeData[key], MODE_FIELDS[key], fallback[mode][key]);
    }
  }
  return out;
}

/** Raises mode values to their readability floors. */
export function applyFloors(values: GlassValues): GlassValues {
  const out = cloneValues(values);
  for (const mode of ["dark", "light"] as const) {
    for (const [key, floor] of Object.entries(READABILITY_FLOORS[mode]) as [ModeKey, number][]) {
      out[mode][key] = Math.max(out[mode][key], floor);
    }
  }
  return out;
}

/**
 * Whether panels go through the SVG filter. They do when they bend or blur. The blur needs it too:
 * in a translucent Windows window the browser draws no blur behind a panel unless the panel's
 * backdrop filter includes an SVG filter, so a zero-strength filter is applied just to carry it.
 */
export function needsPanelFilter(values: GlassValues): boolean {
  return values.refraction > 0 || values.blur > 0;
}

/** Displacement scales for the red, green and blue copies. */
export function channelScales(strength: number, fringe: number): [number, number, number] {
  const step = fringe / 100;
  return [strength, Math.round(strength * (1 - step)), Math.round(strength * (1 - 2 * step))];
}
