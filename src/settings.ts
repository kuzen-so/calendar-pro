import { App, PluginSettingTab, Setting } from "obsidian";
import DiaryHeatmapPlugin from "./main";

export interface HeatmapSettings {
  thresholds: number[];
  defaultYear: "current" | "recent";
  customFolder: string;
  customFormat: string;
  useCustomConfig: boolean;
  weeklyFolder: string;
  weekStart: number;
  showWeekNumbers: boolean;
}

export const DEFAULT_SETTINGS: HeatmapSettings = {
  thresholds: [50, 150, 300, 500],
  defaultYear: "current",
  customFolder: "",
  customFormat: "YYYY-MM-DD",
  useCustomConfig: false,
  weeklyFolder: "",
  weekStart: 1,
  showWeekNumbers: true,
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
    containerEl.createEl("h2", { text: "日历带热力图设置" });

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

    new Setting(containerEl)
      .setName("周记文件夹")
      .setDesc("周记存放的文件夹路径，留空则与日记共用同一文件夹")
      .addText((text) =>
        text
          .setPlaceholder("例如: Weekly 或 周记")
          .setValue(this.plugin.settings.weeklyFolder)
          .onChange(async (value) => {
            this.plugin.settings.weeklyFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("周开始日")
      .setDesc("日历视图以星期几作为一周的开始")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("0", "周日")
          .addOption("1", "周一")
          .addOption("2", "周二")
          .addOption("3", "周三")
          .addOption("4", "周四")
          .addOption("5", "周五")
          .addOption("6", "周六")
          .setValue(String(this.plugin.settings.weekStart))
          .onChange(async (value) => {
            this.plugin.settings.weekStart = parseInt(value);
            await this.plugin.saveSettings();
            window.moment.updateLocale(window.moment.locale(), {
              week: { dow: parseInt(value) },
            });
          })
      );

    new Setting(containerEl)
      .setName("展现周数")
      .setDesc("在日历视图左侧显示周数标签")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showWeekNumbers)
          .onChange(async (value) => {
            this.plugin.settings.showWeekNumbers = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
