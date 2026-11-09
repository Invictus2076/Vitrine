import { App, DropdownComponent, Notice, Platform, PluginSettingTab, Setting } from "obsidian";
import {
  MODE_FIELDS, PRESETS, PRESET_IDS, READABILITY_FLOORS, SHARED_FIELDS,
  type FieldSpec, type Mode, type ModeKey, type PresetId, type SharedKey,
} from "./glass.ts";
import type VitrinePlugin from "./main.ts";
import { chosenValues, editValue, resetToBase, selectCustom, selectPreset, type ValueTarget } from "./state.ts";
import type { Material } from "./window-material.ts";

const MATERIAL_PROBLEMS: Partial<Record<string, string>> = {
  "no-api": "Couldn't reach Obsidian's window controls, so the window stays solid.",
  failed: "Windows refused the material, so the window stays solid. Copy diagnostics below for details.",
};

const SHARED_GROUPS: { heading: string; keys: SharedKey[] }[] = [
  { heading: "Panels", keys: ["blur", "saturation", "radius"] },
  { heading: "Refraction", keys: ["refraction", "bezel", "fringe"] },
];

export class VitrineSettingTab extends PluginSettingTab {
  private lookDropdown: DropdownComponent | null = null;
  private lookSetting: Setting | null = null;
  private resetSetting: Setting | null = null;

  constructor(app: App, private readonly plugin: VitrinePlugin) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl, plugin } = this;
    containerEl.empty();
    this.showThemeWarning();

    new Setting(containerEl).setName("Look").setHeading();
    this.lookSetting = new Setting(containerEl).setName("Preset").addDropdown((dropdown) => {
      this.lookDropdown = dropdown;
      this.fillLookOptions();
      dropdown.onChange((value) => {
        const next = value === "custom" ? selectCustom(plugin.settings) : selectPreset(plugin.settings, value as PresetId);
        plugin.update(next);
        this.display();
      });
    });
    this.resetSetting = new Setting(containerEl)
      .setDesc("Go back to the preset your Custom look started from. Custom stays saved and can be picked again.")
      .addButton((button) =>
        button.setButtonText("Reset to preset").onClick(() => {
          plugin.update(resetToBase(plugin.settings));
          this.display();
        }),
      );
    this.refreshLook();

    new Setting(containerEl)
      .setName("Show advanced settings")
      .setDesc("Fine-tune the glass. Moving any slider saves your changes as the Custom look.")
      .addToggle((toggle) =>
        toggle.setValue(plugin.settings.showAdvanced).onChange((value) => {
          plugin.update({ ...plugin.settings, showAdvanced: value });
          this.display();
        }),
      );
    if (plugin.settings.showAdvanced) this.showAdvanced();

    if (Platform.isWin) {
      new Setting(containerEl).setName("Window").setHeading();
      new Setting(containerEl)
        .setName("Window material")
        .setDesc("Acrylic shows the desktop wallpaper blurred behind Obsidian. Mica only picks up its colour. Needs Windows 11 22H2 or later, with transparency effects turned on.")
        .addDropdown((dropdown) =>
          dropdown
            .addOptions({ acrylic: "Acrylic", mica: "Mica", tabbed: "Mica Alt", none: "Off" })
            .setValue(plugin.settings.material)
            .onChange((value) => {
              plugin.update({ ...plugin.settings, material: value as Material });
              plugin.applyMaterial();
              this.display();
            }),
        );
      const problem = MATERIAL_PROBLEMS[plugin.materialStatus];
      if (problem) containerEl.createEl("p", { text: problem, cls: "setting-item-description mod-warning" });
    }

    new Setting(containerEl).setName("Performance").setHeading();
    new Setting(containerEl)
      .setName("Refraction")
      .setDesc("Bend what is behind panels at their edges. Turn off on slower computers; the rest of the look stays.")
      .addToggle((toggle) =>
        toggle.setValue(plugin.settings.refractionEnabled).onChange((value) => {
          plugin.update({ ...plugin.settings, refractionEnabled: value });
        }),
      );

    this.showHeadingSettings();

    new Setting(containerEl).setName("Help").setHeading();
    new Setting(containerEl)
      .setName("Copy diagnostics")
      .setDesc("Copies a short report about your setup to the clipboard, to paste into a bug report. Nothing is sent anywhere.")
      .addButton((button) => button.setButtonText("Copy").onClick(() => void plugin.copyDiagnostics()));
  }

  private showThemeWarning(): void {
    const { state, contract } = this.plugin.themeState();
    if (state === "active") return;
    const text =
      state === "missing"
        ? "The Vitrine theme isn't active, so these settings have no visible effect. Choose it in Settings → Appearance → Themes."
        : `The Vitrine theme is a different version from this plugin (theme contract ${contract}). Update both to the same version.`;
    this.containerEl.createEl("p", { text, cls: "setting-item-description mod-warning" });
  }

  private fillLookOptions(): void {
    const dropdown = this.lookDropdown;
    if (!dropdown) return;
    dropdown.selectEl.empty();
    for (const id of PRESET_IDS) dropdown.addOption(id, PRESETS[id].name);
    const custom = this.plugin.settings.custom;
    if (custom) dropdown.addOption("custom", `Custom (based on ${PRESETS[custom.basedOn].name})`);
    dropdown.setValue(this.plugin.settings.look);
  }

  /** Updates the preset row in place, so a slider being dragged is never rebuilt. */
  private refreshLook(): void {
    const { settings } = this.plugin;
    this.fillLookOptions();
    const desc =
      settings.look === "custom" && settings.custom
        ? `Your own look, started from ${PRESETS[settings.custom.basedOn].name}.`
        : PRESETS[settings.look === "custom" ? "vitrine" : settings.look].desc;
    this.lookSetting?.setDesc(desc);
    this.resetSetting?.settingEl.toggle(settings.look === "custom");
  }

  private showAdvanced(): void {
    const mode: Mode = document.body.classList.contains("theme-light") ? "light" : "dark";
    const values = chosenValues(this.plugin.settings);

    for (const group of SHARED_GROUPS) {
      new Setting(this.containerEl).setName(group.heading).setHeading();
      for (const key of group.keys) this.slider(SHARED_FIELDS[key], values[key], { key });
    }

    new Setting(this.containerEl)
      .setName(`Colours in ${mode} mode`)
      .setDesc(`These apply to ${mode} mode only. Switch Obsidian to ${mode === "dark" ? "light" : "dark"} mode to edit that mode's values.`)
      .setHeading();
    const showWindowTint = Platform.isWin || document.body.classList.contains("is-translucent");
    for (const key of Object.keys(MODE_FIELDS) as ModeKey[]) {
      if (key === "windowTint" && !showWindowTint) continue;
      const floor = READABILITY_FLOORS[mode][key];
      const spec = floor === undefined ? MODE_FIELDS[key] : { ...MODE_FIELDS[key], desc: `${MODE_FIELDS[key].desc} The look never goes below ${floor}%, so text stays readable.` };
      this.slider(spec, values[mode][key], { key, mode });
    }
  }

  private slider(spec: FieldSpec, value: number, target: ValueTarget): void {
    const name = spec.unit ? `${spec.name} (${spec.unit})` : spec.name;
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(spec.desc)
      .addSlider((slider) =>
        slider
          .setLimits(spec.min, spec.max, 1)
          .setValue(value)
          .setDynamicTooltip()
          .onChange((next) => {
            const result = editValue(this.plugin.settings, target, next);
            this.plugin.update(result.settings);
            if (result.replacedCustom) new Notice("Vitrine: your earlier Custom look was replaced by this one.");
            this.refreshLook();
          }),
      );
  }

  private showHeadingSettings(): void {
    const { plugin } = this;
    new Setting(this.containerEl).setName("Glass headings").setHeading();
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      new Setting(this.containerEl).setName(`Heading ${level}`).addToggle((toggle) =>
        toggle.setValue(plugin.settings.headings.levels[level]).onChange((value) => {
          const levels = { ...plugin.settings.headings.levels, [level]: value };
          plugin.update({ ...plugin.settings, headings: { ...plugin.settings.headings, levels } });
        }),
      );
    }
    const headingToggle = (name: string, desc: string, key: "noteTitle" | "inEditingView" | "inReadingView" | "spectrum") =>
      new Setting(this.containerEl)
        .setName(name)
        .setDesc(desc)
        .addToggle((toggle) =>
          toggle.setValue(plugin.settings.headings[key]).onChange((value) => {
            plugin.update({ ...plugin.settings, headings: { ...plugin.settings.headings, [key]: value } });
          }),
        );
    headingToggle("Note title", "The title shown above each note.", "noteTitle");
    headingToggle("In editing view", "Live Preview and source mode.", "inEditingView");
    headingToggle("In reading view", "", "inReadingView");
    headingToggle("Colour in the glass", "Tint glass headings with a cyan, blue, purple, pink and orange spectrum.", "spectrum");
  }
}
