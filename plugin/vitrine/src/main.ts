import { Notice, Platform, Plugin, apiVersion, debounce } from "obsidian";
import { CONTRACT_VERSION, GLASS_VARIABLE_NAMES, HEADING_CLASS_NAMES, glassVariables, headingClasses } from "./css.ts";
import { needsPanelFilter } from "./glass.ts";
import { formatDiagnostics, type ThemeState } from "./diagnostics.ts";
import { Refractor, type RefractionOptions } from "./refraction.ts";
import { VitrineSettingTab } from "./settings-tab.ts";
import { effectiveValues, loadSettings, type VitrineSettings } from "./state.ts";
import { currentWindow, nodeRequire, type MaterialStatus } from "./window-material.ts";

export default class VitrinePlugin extends Plugin {
  declare settings: VitrineSettings;
  materialStatus: MaterialStatus = "off";
  private refractor: Refractor | null = null;
  private addedTranslucentClass = false;
  /** The look updates live; the file is written once changes stop. */
  private readonly saveSoon = debounce(() => void this.saveData(this.settings), 600, true);

  override async onload(): Promise<void> {
    this.settings = loadSettings(await this.loadData());
    this.applyLook();
    this.applyMaterial();
    this.app.workspace.onLayoutReady(() => this.applyLook());
    this.addSettingTab(new VitrineSettingTab(this.app, this));
    this.addCommand({ id: "copy-diagnostics", name: "Copy diagnostics", callback: () => void this.copyDiagnostics() });

    this.register(() => {
      this.saveSoon.run();
      this.refractor?.stop();
      this.refractor = null;
      HEADING_CLASS_NAMES.forEach((name) => document.body.classList.remove(name));
      GLASS_VARIABLE_NAMES.forEach((name) => document.body.style.removeProperty(name));
      this.removeMaterial();
    });
  }

  /** Settings changed on disk, for example by Obsidian Sync. */
  override async onExternalSettingsChange(): Promise<void> {
    this.settings = loadSettings(await this.loadData());
    this.applyLook();
    this.applyMaterial();
  }

  /** Applies new settings right away and saves them shortly after. */
  update(next: VitrineSettings): void {
    this.settings = next;
    this.applyLook();
    this.saveSoon();
  }

  /** Passes the look to the theme and starts, retunes or stops refraction. */
  applyLook(): void {
    const body = document.body;
    for (const [name, on] of Object.entries(headingClasses(this.settings.headings))) body.classList.toggle(name, on);
    const values = effectiveValues(this.settings);
    for (const [name, value] of Object.entries(glassVariables(values))) body.style.setProperty(name, value);

    // Refraction waits for the layout, so its first scan finds the status bar
    if (!this.app.workspace.layoutReady) return;
    const options: RefractionOptions = { strength: values.refraction, bezel: values.bezel, fringe: values.fringe };
    if (needsPanelFilter(values) && !this.refractor) {
      this.refractor = new Refractor(document, options);
      this.refractor.start();
    } else if (needsPanelFilter(values)) {
      this.refractor!.setOptions(options);
    } else if (this.refractor) {
      this.refractor.stop();
      this.refractor = null;
    }
  }

  /** Windows only. Asks the OS for the chosen material and marks the body translucent for the theme. */
  applyMaterial(): void {
    if (!Platform.isWin) {
      this.materialStatus = "unsupported-os";
      return;
    }
    if (this.settings.material === "none") {
      this.removeMaterial();
      this.materialStatus = "off";
      return;
    }
    const win = currentWindow();
    if (!win) {
      this.materialStatus = "no-api";
      return;
    }
    try {
      win.setBackgroundMaterial(this.settings.material);
    } catch (error) {
      console.error("Vitrine: could not set the window material", error);
      this.materialStatus = "failed";
      return;
    }
    this.materialStatus = "on";
    if (!document.body.classList.contains("is-translucent")) {
      document.body.classList.add("is-translucent");
      this.addedTranslucentClass = true;
    }
  }

  /** Whether the Vitrine theme is active and speaks the same contract version. */
  themeState(): { state: ThemeState; contract: string } {
    const contract = getComputedStyle(document.body).getPropertyValue("--vt-contract").trim();
    if (!contract) return { state: "missing", contract };
    return { state: contract === String(CONTRACT_VERSION) ? "active" : "mismatch", contract };
  }

  async copyDiagnostics(): Promise<void> {
    const sample = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return "not on screen" as const;
      const s = getComputedStyle(el);
      return { "backdrop-filter": s.backdropFilter, "background-color": s.backgroundColor, "border-radius": s.borderRadius };
    };
    let os = navigator.platform;
    try {
      const nodeOs = nodeRequire("os") as { type(): string; release(): string };
      os = `${nodeOs.type()} ${nodeOs.release()}`;
    } catch {
      /* not available */
    }
    const report = formatDiagnostics({
      pluginVersion: this.manifest.version,
      obsidianVersion: apiVersion,
      electron: navigator.userAgent.match(/Electron\/([\d.]+)/)?.[1] ?? "unknown",
      chrome: navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? "unknown",
      os,
      colourScheme: document.body.classList.contains("theme-light") ? "light" : "dark",
      theme: this.themeState(),
      material: {
        requested: this.settings.material,
        status: this.materialStatus,
        translucentClass: document.body.classList.contains("is-translucent"),
        addedByVitrine: this.addedTranslucentClass,
      },
      settings: this.settings,
      effective: effectiveValues(this.settings),
      refraction: { running: !!this.refractor, panels: this.refractor?.panelCount ?? 0, cachedMaps: this.refractor?.cachedMaps ?? 0 },
      samples: { "Status bar": sample(".status-bar"), "Active tab": sample(".workspace-tab-header.is-active .workspace-tab-header-inner") },
    });
    await navigator.clipboard.writeText(report);
    new Notice("Vitrine diagnostics copied to the clipboard.");
  }

  private removeMaterial(): void {
    if (this.materialStatus === "on") {
      try {
        currentWindow()?.setBackgroundMaterial("none");
      } catch (error) {
        console.error("Vitrine: could not clear the window material", error);
      }
    }
    if (this.addedTranslucentClass) {
      document.body.classList.remove("is-translucent");
      this.addedTranslucentClass = false;
    }
  }
}
