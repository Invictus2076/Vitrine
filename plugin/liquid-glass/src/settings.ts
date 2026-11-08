import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import type LiquidGlassPlugin from "./main.ts";
import type { Material } from "./window-material.ts";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface LiquidGlassSettings {
  material: Material;
  /** Percentage of the base colour laid over the wallpaper. */
  windowTint: number;
  /** Percentage of the surface colour in floating panels. */
  panelTint: number;
  blurPx: number;
  refraction: boolean;
  /** Edge displacement in pixels for the red channel. The website uses 30. */
  refractionStrength: number;
  glassHeadings: Record<HeadingLevel, boolean>;
  glassNoteTitle: boolean;
  inEditingView: boolean;
  inReadingView: boolean;
  spectrum: boolean;
}

export const DEFAULT_SETTINGS: LiquidGlassSettings = {
  material: "acrylic",
  windowTint: 58,
  panelTint: 74,
  blurPx: 24,
  refraction: true,
  refractionStrength: 30,
  glassHeadings: { 1: true, 2: true, 3: false, 4: false, 5: false, 6: false },
  glassNoteTitle: true,
  inEditingView: true,
  inReadingView: true,
  spectrum: false,
};

/** Merges saved data over the defaults, field by field, so new settings get defaults. */
export function withDefaults(saved: unknown): LiquidGlassSettings {
  const data = (saved ?? {}) as Partial<LiquidGlassSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    glassHeadings: { ...DEFAULT_SETTINGS.glassHeadings, ...data.glassHeadings },
  };
}

type NumberKey = "windowTint" | "panelTint" | "blurPx" | "refractionStrength";
type ToggleKey = "refraction" | "glassNoteTitle" | "inEditingView" | "inReadingView" | "spectrum";

const MATERIAL_PROBLEMS: Partial<Record<string, string>> = {
  "no-api": "Couldn't reach Obsidian's window controls, so the window stays solid.",
  failed: "Windows refused the material, so the window stays solid. The developer console (Ctrl+Shift+I) has the error.",
};

export class LiquidGlassSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: LiquidGlassPlugin) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl, plugin } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Window").setHeading();

    if (Platform.isWin) {
      new Setting(containerEl)
        .setName("Window material")
        .setDesc("Acrylic shows the desktop wallpaper blurred behind Obsidian. Mica only picks up its colour. Needs Windows 11 22H2 or later.")
        .addDropdown((dropdown) =>
          dropdown
            .addOptions({ acrylic: "Acrylic", mica: "Mica", tabbed: "Mica Alt", none: "Off" })
            .setValue(plugin.settings.material)
            .onChange(async (value) => {
              plugin.settings.material = value as Material;
              await plugin.saveSettings();
              plugin.applyMaterial();
              this.display();
            }),
        );

      const problem = MATERIAL_PROBLEMS[plugin.materialStatus];
      if (problem) containerEl.createEl("p", { text: problem, cls: "setting-item-description mod-warning" });
    }

    this.slider("Window tint", "How much of the base colour covers the wallpaper. Higher is easier to read.", "windowTint", 0, 95);

    new Setting(containerEl).setName("Floating panels").setHeading();
    this.slider("Panel tint", "Command palette, modals, menus, popovers, notices and the status bar.", "panelTint", 30, 95);
    this.slider("Blur", "Blur radius in pixels behind floating panels.", "blurPx", 0, 60);
    this.toggle("Refraction", "Bend the content behind each panel at its edges. Turn off on slower machines.", "refraction");
    this.slider("Refraction strength", "Displacement at the edge in pixels. Your website uses 30.", "refractionStrength", 0, 60);

    new Setting(containerEl).setName("Glass headings").setHeading();
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      new Setting(containerEl).setName(`Heading ${level}`).addToggle((toggle) =>
        toggle.setValue(plugin.settings.glassHeadings[level]).onChange(async (value) => {
          plugin.settings.glassHeadings[level] = value;
          await plugin.saveSettings();
          plugin.applyLook();
        }),
      );
    }
    this.toggle("Note title", "The inline title above each note.", "glassNoteTitle");
    this.toggle("In editing view", "Live Preview and source mode.", "inEditingView");
    this.toggle("In reading view", "", "inReadingView");
    this.toggle("Colour in the glass", "Tint glass headings with cyan, blue, purple, pink and orange, the colours of your website's fluid.", "spectrum");
  }

  private slider(name: string, desc: string, key: NumberKey, min: number, max: number): void {
    const { plugin } = this;
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(desc)
      .addSlider((slider) =>
        slider
          .setLimits(min, max, 1)
          .setValue(plugin.settings[key])
          .setDynamicTooltip()
          .onChange(async (value) => {
            plugin.settings[key] = value;
            await plugin.saveSettings();
            plugin.applyLook();
          }),
      );
  }

  private toggle(name: string, desc: string, key: ToggleKey): void {
    const { plugin } = this;
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(desc)
      .addToggle((toggle) =>
        toggle.setValue(plugin.settings[key]).onChange(async (value) => {
          plugin.settings[key] = value;
          await plugin.saveSettings();
          plugin.applyLook();
        }),
      );
  }
}
