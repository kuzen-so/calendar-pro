import { App, PluginSettingTab, Setting } from "obsidian";
import DiaryHeatmapPlugin from "./main";

export interface HeatmapSettings {
  thresholds: number[];
  defaultYear: "current" | "recent";
  customFolder: string;
  customFormat: string;
  useCustomConfig: boolean;
}

export const DEFAULT_SETTINGS: HeatmapSettings = {
  thresholds: [100, 300, 600, 1000],
  defaultYear: "current",
  customFolder: "",
  customFormat: "YYYY-MM-DD",
  useCustomConfig: false,
};

export class HeatmapSettingTab extends PluginSettingTab {
  plugin: DiaryHeatmapPlugin;

  constructor(app: App, plugin: DiaryHeatmapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "日记热力图设置" });

    new Setting(containerEl)
      .setName("使用自定义日记配置")
      .setDesc("如果未启用 Daily Notes 插件，或想覆盖其配置，请开启此选项")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useCustomConfig)
          .onChange(async (value) => {
            this.plugin.settings.useCustomConfig = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.useCustomConfig) {
      new Setting(containerEl)
        .setName("日记文件夹")
        .setDesc("日记存放的文件夹路径，留空表示根目录")
        .addText((text) =>
          text
            .setPlaceholder("例如: Journal 或 日记")
            .setValue(this.plugin.settings.customFolder)
            .onChange(async (value) => {
              this.plugin.settings.customFolder = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("日期格式")
        .setDesc("日记文件的日期格式（moment.js 格式）")
        .addText((text) =>
          text
            .setPlaceholder("YYYY-MM-DD")
            .setValue(this.plugin.settings.customFormat)
            .onChange(async (value) => {
              this.plugin.settings.customFormat = value || "YYYY-MM-DD";
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName("默认显示年份")
      .setDesc("打开热力图时默认显示的时间范围")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("current", "当年完整年份")
          .addOption("recent", "近一年")
          .setValue(this.plugin.settings.defaultYear)
          .onChange(async (value: "current" | "recent") => {
            this.plugin.settings.defaultYear = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "热力图字数阈值" });
    containerEl.createEl("p", {
      text: "设置每个颜色等级对应的字数上限",
      cls: "setting-item-description",
    });

    const levels = ["浅", "中", "深", "最深"];
    this.plugin.settings.thresholds.forEach((threshold, index) => {
      new Setting(containerEl)
        .setName(`等级 ${index + 1} (${levels[index]})`)
        .setDesc(`字数 ≤ ${threshold} 时显示此颜色`)
        .addSlider((slider) =>
          slider
            .setLimits(10, 5000, 10)
            .setValue(threshold)
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.thresholds[index] = value;
              await this.plugin.saveSettings();
            })
        );
    });
  }
}
