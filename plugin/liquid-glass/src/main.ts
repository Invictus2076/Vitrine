import { Platform, Plugin } from "obsidian";
import { Refractor } from "./refraction.ts";
import { LiquidGlassSettingTab, withDefaults, type LiquidGlassSettings } from "./settings.ts";
import { currentWindow, type MaterialStatus } from "./window-material.ts";

/** Body classes the theme reads. `lg-plugin` tells it to follow these instead of its defaults. */
const BODY_CLASSES = [
  "lg-plugin", "lg-h1", "lg-h2", "lg-h3", "lg-h4", "lg-h5", "lg-h6",
  "lg-inline-title", "lg-edit", "lg-read", "lg-spectrum",
];
const BODY_VARIABLES = ["--lg-window-tint", "--lg-float-tint", "--lg-blur"];

export default class LiquidGlassPlugin extends Plugin {
  declare settings: LiquidGlassSettings;
  materialStatus: MaterialStatus = "off";
  private refractor: Refractor | null = null;
  private addedTranslucentClass = false;

  override async onload(): Promise<void> {
    this.settings = withDefaults(await this.loadData());
    this.applyLook();
    this.applyMaterial();
    this.app.workspace.onLayoutReady(() => this.applyLook());
    this.addSettingTab(new LiquidGlassSettingTab(this.app, this));

    this.register(() => {
      this.refractor?.stop();
      this.refractor = null;
      BODY_CLASSES.forEach((name) => document.body.classList.remove(name));
      BODY_VARIABLES.forEach((name) => document.body.style.removeProperty(name));
      this.removeMaterial();
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Passes the settings to the theme and starts, stops or retunes refraction. */
  applyLook(): void {
    const s = this.settings;
    const body = document.body;
    body.classList.add("lg-plugin");
    for (const level of [1, 2, 3, 4, 5, 6] as const) body.classList.toggle(`lg-h${level}`, s.glassHeadings[level]);
    body.classList.toggle("lg-inline-title", s.glassNoteTitle);
    body.classList.toggle("lg-edit", s.inEditingView);
    body.classList.toggle("lg-read", s.inReadingView);
    body.classList.toggle("lg-spectrum", s.spectrum);
    body.style.setProperty("--lg-window-tint", `${s.windowTint}%`);
    body.style.setProperty("--lg-float-tint", `${s.panelTint}%`);
    body.style.setProperty("--lg-blur", `${s.blurPx}px`);

    // Refraction waits for the layout, so its first scan finds the status bar
    if (!this.app.workspace.layoutReady) return;
    const wantRefraction = s.refraction && s.refractionStrength > 0;
    if (wantRefraction && !this.refractor) {
      this.refractor = new Refractor(document, s.refractionStrength);
      this.refractor.start();
    } else if (wantRefraction) {
      this.refractor!.setStrength(s.refractionStrength);
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
      console.error("Liquid Glass: could not set the window material", error);
      this.materialStatus = "failed";
      return;
    }
    this.materialStatus = "on";
    if (!document.body.classList.contains("is-translucent")) {
      document.body.classList.add("is-translucent");
      this.addedTranslucentClass = true;
    }
  }

  private removeMaterial(): void {
    if (this.materialStatus === "on") {
      try {
        currentWindow()?.setBackgroundMaterial("none");
      } catch (error) {
        console.error("Liquid Glass: could not clear the window material", error);
      }
    }
    if (this.addedTranslucentClass) {
      document.body.classList.remove("is-translucent");
      this.addedTranslucentClass = false;
    }
  }
}
