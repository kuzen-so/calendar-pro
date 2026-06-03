import { Plugin } from "obsidian";
import { HeatmapSettings, DEFAULT_SETTINGS, HeatmapSettingTab } from "./settings";
import { HeatmapView, VIEW_TYPE_DIARY_HEATMAP } from "./ui/heatmap-view";
import { getDailyNotesConfig, DailyNotesConfig } from "./utils/daily-notes-config";

export default class DiaryHeatmapPlugin extends Plugin {
  settings: HeatmapSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    console.log("[Calendar Pro] Plugin loaded v1.3.0");

    this.registerView(
      VIEW_TYPE_DIARY_HEATMAP,
      (leaf) => new HeatmapView(leaf, this)
    );

    this.addRibbonIcon("calendar", "Calendar Pro", () => {
      this.activateHeatmapView();
    });

    this.addCommand({
      id: "open-diary-heatmap",
      name: "打开 Calendar Pro",
      callback: () => {
        this.activateHeatmapView();
      },
    });

    this.addCommand({
      id: "close-diary-heatmap",
      name: "关闭 Calendar Pro",
      callback: () => {
        this.closeHeatmapView();
      },
    });

    this.addCommand({
      id: "jump-to-today",
      name: "跳转到今天",
      callback: () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
        if (leaves.length > 0) {
          const view = leaves[0].view as HeatmapView;
          view.jumpToToday();
        } else {
          this.activateHeatmapView().then(() => {
            const newLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
            if (newLeaves.length > 0) {
              const view = newLeaves[0].view as HeatmapView;
              view.jumpToToday();
            }
          });
        }
      },
    });

    this.addSettingTab(new HeatmapSettingTab(this.app, this));

    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.registerEvent(
        this.app.workspace.on("layout-ready", () => {
          this.initLeaf();
        })
      );
    }
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
    console.log("[Calendar Pro] Plugin unloaded");
  }

  async loadSettings(): Promise<void> {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    this.settings.thresholds = this.validateThresholds(this.settings.thresholds);
    this.settings.colors = this.validateColors(this.settings.colors);
    this.settings.darkColors = this.validateColors(this.settings.darkColors);
  }

  private validateThresholds(thresholds: number[]): number[] {
    if (!Array.isArray(thresholds) || thresholds.length !== 5) {
      return [...DEFAULT_SETTINGS.thresholds];
    }
    const valid = thresholds.map((t) => Math.max(1, Math.round(Number(t))));
    for (let i = 1; i < valid.length; i++) {
      if (valid[i] <= valid[i - 1]) {
        valid[i] = valid[i - 1] + 50;
      }
    }
    return valid;
  }

  private validateColors(colors: string[]): string[] {
    if (!Array.isArray(colors) || colors.length !== 6) {
      return [...DEFAULT_SETTINGS.colors];
    }
    return colors.map((c) =>
      typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c)
        ? c
        : "#999999"
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private initLeaf(): void {
    const { workspace } = this.app;
    if (workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP).length > 0) {
      return;
    }
    workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_DIARY_HEATMAP,
    });
  }

  async activateHeatmapView(): Promise<void> {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
    if (leaves.length > 0) {
      workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = workspace.getRightLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_DIARY_HEATMAP,
      active: true,
    });
    workspace.revealLeaf(leaf);
  }

  closeHeatmapView(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
  }

  async getEffectiveConfig(): Promise<DailyNotesConfig> {
    if (this.settings.useCustomConfig) {
      return {
        folder: this.settings.customFolder,
        format: this.settings.customFormat,
        template: "",
      };
    }
    return await getDailyNotesConfig(this.app);
  }
}
