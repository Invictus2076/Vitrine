/**
 * A plain-text report for bug reports. It is built and copied locally; nothing is sent anywhere.
 */
import { PRESETS, type GlassValues } from "./glass.ts";
import type { VitrineSettings } from "./state.ts";
import type { MaterialStatus } from "./window-material.ts";

export type ThemeState = "active" | "missing" | "mismatch";

export interface DiagnosticsInput {
  pluginVersion: string;
  obsidianVersion: string;
  electron: string;
  chrome: string;
  os: string;
  colourScheme: "dark" | "light";
  theme: { state: ThemeState; contract: string };
  material: { requested: string; status: MaterialStatus; translucentClass: boolean; addedByVitrine: boolean };
  settings: VitrineSettings;
  effective: GlassValues;
  refraction: { running: boolean; panels: number; cachedMaps: number };
  samples: Record<string, Record<string, string> | "not on screen">;
}

export function formatDiagnostics(d: DiagnosticsInput): string {
  const custom = d.settings.custom;
  const look = d.settings.look === "custom" && custom ? `Custom (based on ${PRESETS[custom.basedOn].name})` : PRESETS[d.settings.look === "custom" ? "vitrine" : d.settings.look].name;
  const lines = [
    "Vitrine diagnostics",
    `Plugin ${d.pluginVersion}, Obsidian ${d.obsidianVersion}, Electron ${d.electron}, Chrome ${d.chrome}, ${d.os}`,
    `Colour scheme: ${d.colourScheme}`,
    `Theme: ${d.theme.state}${d.theme.contract ? ` (contract ${d.theme.contract})` : ""}`,
    `Window material: ${d.material.requested}, status ${d.material.status}, is-translucent ${d.material.translucentClass ? "yes" : "no"}${d.material.addedByVitrine ? " (added by Vitrine)" : ""}`,
    `Look: ${look}, refraction switch ${d.settings.refractionEnabled ? "on" : "off"}`,
    `Refraction: ${d.refraction.running ? `running; panels tracked: ${d.refraction.panels}; maps cached: ${d.refraction.cachedMaps}` : "stopped"}`,
    `Values in use: ${JSON.stringify(d.effective)}`,
    `Headings: ${JSON.stringify(d.settings.headings)}`,
  ];
  for (const [name, sample] of Object.entries(d.samples)) {
    lines.push(`${name}: ${typeof sample === "string" ? sample : Object.entries(sample).map(([k, v]) => `${k}: ${v}`).join("; ")}`);
  }
  return lines.join("\n");
}
