/**
 * Windows window materials through Electron's BrowserWindow.setBackgroundMaterial.
 * Obsidian has no Windows translucency option of its own; this reaches the window the same way
 * the Pseudo Mica plugin does, through @electron/remote, which Obsidian ships.
 */

export type Material = "acrylic" | "mica" | "tabbed" | "none";

/** What happened the last time a material was applied, for the settings tab to explain. */
export type MaterialStatus = "unsupported-os" | "off" | "on" | "no-api" | "failed";

interface MaterialWindow {
  setBackgroundMaterial(material: Material): void;
}

declare const require: (id: string) => unknown;

export function currentWindow(): MaterialWindow | null {
  try {
    const remote = require("@electron/remote") as { getCurrentWindow(): Partial<MaterialWindow> };
    const win = remote.getCurrentWindow();
    return typeof win.setBackgroundMaterial === "function" ? (win as MaterialWindow) : null;
  } catch {
    return null;
  }
}
