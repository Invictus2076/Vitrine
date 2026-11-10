/**
 * Saved settings: their shape, loading and migration, and the preset/Custom rules. Pure, no DOM.
 *
 * A built-in preset is saved by id, and its values come from the code, so retuned presets reach
 * everyone. Custom is a full copy of every value for both modes, so it never changes on its own.
 */
import {
  DEFAULT_PRESET, PRESETS, PRESET_IDS, applyFloors, cloneValues, sanitizeValues,
  type GlassValues, type Mode, type ModeKey, type PresetId, type SharedKey,
} from "./glass.ts";
import type { Material } from "./window-material.ts";

export const SCHEMA_VERSION = 2;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingSettings {
  levels: Record<HeadingLevel, boolean>;
  noteTitle: boolean;
  inEditingView: boolean;
  inReadingView: boolean;
  spectrum: boolean;
}

export interface CustomLook {
  basedOn: PresetId;
  values: GlassValues;
}

export interface VitrineSettings {
  schemaVersion: typeof SCHEMA_VERSION;
  look: PresetId | "custom";
  custom: CustomLook | null;
  material: Material;
  /** Master switch for refraction, outside the presets, for slower computers. */
  refractionEnabled: boolean;
  /** Master switch for the blur behind panels, outside the presets, for slower computers. */
  panelBlur: boolean;
  headings: HeadingSettings;
  showAdvanced: boolean;
}

const MATERIALS: Material[] = ["acrylic", "mica", "tabbed", "none"];

export function defaultSettings(): VitrineSettings {
  return {
    schemaVersion: SCHEMA_VERSION,
    look: DEFAULT_PRESET,
    custom: null,
    material: "acrylic",
    refractionEnabled: true,
    panelBlur: true,
    headings: {
      levels: { 1: true, 2: true, 3: false, 4: false, 5: false, 6: false },
      noteTitle: true,
      inEditingView: true,
      inReadingView: true,
      spectrum: false,
    },
    showAdvanced: false,
  };
}

const isPresetId = (value: unknown): value is PresetId => PRESET_IDS.includes(value as PresetId);
const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

/** Version 1 settings, from before presets existed. */
interface V1Settings {
  material?: unknown;
  windowTint?: unknown;
  panelTint?: unknown;
  blurPx?: unknown;
  refraction?: unknown;
  refractionStrength?: unknown;
  glassHeadings?: Partial<Record<HeadingLevel, unknown>>;
  glassNoteTitle?: unknown;
  inEditingView?: unknown;
  inReadingView?: unknown;
  spectrum?: unknown;
}

const V1_DEFAULTS = { windowTint: 58, panelTint: 74, blurPx: 24, refractionStrength: 30 };

/**
 * Version 1 to version 2. Untouched v1 values become the Vitrine preset, so they pick up the retuned
 * defaults. Changed values become Custom, based on Vitrine, with the old flat values in both modes.
 */
export function migrateV1(old: V1Settings): Record<string, unknown> {
  const isDefault = (key: keyof typeof V1_DEFAULTS) => old[key] === undefined || old[key] === V1_DEFAULTS[key];
  const untouched = (Object.keys(V1_DEFAULTS) as (keyof typeof V1_DEFAULTS)[]).every(isDefault);

  let custom: CustomLook | null = null;
  if (!untouched) {
    const values = cloneValues(PRESETS.vitrine.values);
    if (typeof old.blurPx === "number") values.blur = old.blurPx;
    if (typeof old.refractionStrength === "number") values.refraction = old.refractionStrength;
    for (const mode of ["dark", "light"] as const) {
      if (typeof old.windowTint === "number") values[mode].windowTint = old.windowTint;
      if (typeof old.panelTint === "number") values[mode].panelTint = old.panelTint;
    }
    custom = { basedOn: "vitrine", values };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    look: custom ? "custom" : DEFAULT_PRESET,
    custom,
    material: old.material,
    refractionEnabled: old.refraction,
    headings: {
      levels: old.glassHeadings,
      noteTitle: old.glassNoteTitle,
      inEditingView: old.inEditingView,
      inReadingView: old.inReadingView,
      spectrum: old.spectrum,
    },
  };
}

/** Turns whatever is in data.json (any version, partial, hand-edited or empty) into valid settings. */
export function loadSettings(saved: unknown): VitrineSettings {
  let data = (saved && typeof saved === "object" ? saved : {}) as Record<string, unknown>;
  const isV1 = data.schemaVersion === undefined && ("windowTint" in data || "glassHeadings" in data || "blurPx" in data);
  if (isV1) data = migrateV1(data as V1Settings);

  const defaults = defaultSettings();
  const rawCustom = data.custom as { basedOn?: unknown; values?: unknown } | null | undefined;
  const custom: CustomLook | null =
    rawCustom && typeof rawCustom === "object"
      ? (() => {
          const basedOn = isPresetId(rawCustom.basedOn) ? rawCustom.basedOn : DEFAULT_PRESET;
          return { basedOn, values: sanitizeValues(rawCustom.values, PRESETS[basedOn].values) };
        })()
      : null;

  let look: VitrineSettings["look"] = isPresetId(data.look) ? data.look : DEFAULT_PRESET;
  if (data.look === "custom" && custom) look = "custom";

  const rawHeadings = (data.headings ?? {}) as Partial<Record<keyof HeadingSettings, unknown>>;
  const rawLevels = (rawHeadings.levels ?? {}) as Partial<Record<HeadingLevel, unknown>>;
  const levels = { ...defaults.headings.levels };
  for (const level of [1, 2, 3, 4, 5, 6] as const) levels[level] = bool(rawLevels[level], levels[level]);

  return {
    schemaVersion: SCHEMA_VERSION,
    look,
    custom,
    material: MATERIALS.includes(data.material as Material) ? (data.material as Material) : defaults.material,
    refractionEnabled: bool(data.refractionEnabled, defaults.refractionEnabled),
    panelBlur: bool(data.panelBlur, defaults.panelBlur),
    headings: {
      levels,
      noteTitle: bool(rawHeadings.noteTitle, defaults.headings.noteTitle),
      inEditingView: bool(rawHeadings.inEditingView, defaults.headings.inEditingView),
      inReadingView: bool(rawHeadings.inReadingView, defaults.headings.inReadingView),
      spectrum: bool(rawHeadings.spectrum, defaults.headings.spectrum),
    },
    showAdvanced: bool(data.showAdvanced, defaults.showAdvanced),
  };
}

/** The values the user has chosen, before floors and the refraction switch. */
export function chosenValues(settings: VitrineSettings): GlassValues {
  if (settings.look === "custom" && settings.custom) return settings.custom.values;
  return PRESETS[settings.look === "custom" ? DEFAULT_PRESET : settings.look].values;
}

/** The values to draw: chosen values, raised to the readability floors, with refraction and blur off if switched off. */
export function effectiveValues(settings: VitrineSettings): GlassValues {
  const values = applyFloors(chosenValues(settings));
  if (!settings.refractionEnabled) values.refraction = 0;
  if (!settings.panelBlur) values.blur = 0;
  return values;
}

export function selectPreset(settings: VitrineSettings, id: PresetId): VitrineSettings {
  return { ...settings, look: id };
}

export function selectCustom(settings: VitrineSettings): VitrineSettings {
  return settings.custom ? { ...settings, look: "custom" } : settings;
}

/** Goes back to the preset Custom was made from. The Custom slot is kept. */
export function resetToBase(settings: VitrineSettings): VitrineSettings {
  return settings.custom ? { ...settings, look: settings.custom.basedOn } : settings;
}

export type ValueTarget = { key: SharedKey } | { key: ModeKey; mode: Mode };

export interface EditResult {
  settings: VitrineSettings;
  /** True when this edit replaced an older Custom look that differed from the new one. */
  replacedCustom: boolean;
}

/**
 * Changes one value. On a built-in preset this starts Custom from a copy of that preset,
 * replacing any older Custom, because there is only one Custom slot.
 */
export function editValue(settings: VitrineSettings, target: ValueTarget, value: number): EditResult {
  let custom = settings.custom;
  let replacedCustom = false;
  if (settings.look !== "custom" || !custom) {
    const base = settings.look === "custom" ? DEFAULT_PRESET : settings.look;
    replacedCustom = custom !== null;
    custom = { basedOn: base, values: cloneValues(PRESETS[base].values) };
  } else {
    custom = { basedOn: custom.basedOn, values: cloneValues(custom.values) };
  }
  if ("mode" in target) custom.values[target.mode][target.key] = value;
  else custom.values[target.key] = value;
  return { settings: { ...settings, look: "custom", custom }, replacedCustom };
}
