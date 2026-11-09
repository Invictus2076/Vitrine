/**
 * Windows window materials through Electron's BrowserWindow.setBackgroundMaterial.
 * Obsidian has no Windows translucency option of its own; this reaches the window through
 * @electron/remote, which Obsidian ships. Desktop only.
 */

export type Material = "acrylic" | "mica" | "tabbed" | "none";

/** What happened the last time a material was applied, for the settings tab and diagnostics. */
export type MaterialStatus = "unsupported-os" | "off" | "on" | "no-api" | "failed";

interface MaterialWindow {
  setBackgroundMaterial(material: Material): void;
}

/** Obsidian's desktop app exposes Node's require on window. */
export function nodeRequire(id: string): unknown {
  const req = (window as unknown as { require?: (id: string) => unknown }).require;
  if (!req) throw new Error("require is not available");
  return req(id);
}

export function currentWindow(): MaterialWindow | null {
  try {
    const remote = nodeRequire("@electron/remote") as { getCurrentWindow(): Partial<MaterialWindow> };
    const win = remote.getCurrentWindow();
    return typeof win.setBackgroundMaterial === "function" ? (win as MaterialWindow) : null;
  } catch {
    return null;
  }
}
