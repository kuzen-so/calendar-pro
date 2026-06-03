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
  thresholds: [50, 150, 300, 500, 800],
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
    containerEl.createEl("h2", { text: "Calendar Pro 设置" });

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

    // 热力图字数阈值设置
    containerEl.createEl("h3", { text: "热力图颜色阈值" });
    const thresholdDesc = containerEl.createEl("p", {
      text: "设置 5 档字数阈值，用于划分热力图颜色深浅（需递增）",
      cls: "setting-item-description",
    });
    thresholdDesc.style.marginBottom = "12px";

    const thresholdContainer = containerEl.createDiv();
    thresholdContainer.style.display = "grid";
    thresholdContainer.style.gridTemplateColumns = "repeat(5, 1fr)";
    thresholdContainer.style.gap = "8px";
    thresholdContainer.style.marginBottom = "16px";

    const labels = ["浅 (≤)", "中浅 (≤)", "中 (≤)", "中深 (≤)", "深 (≤)"];
    this.plugin.settings.thresholds.forEach((val, idx) => {
      const box = thresholdContainer.createDiv();
      box.createEl("label", {
        text: labels[idx],
        cls: "setting-item-name",
      }).style.fontSize = "11px";
      const input = box.createEl("input", {
        type: "number",
        value: String(val),
      });
      input.style.width = "100%";
      input.style.padding = "4px 6px";
      input.style.borderRadius = "4px";
      input.style.border = "1px solid var(--background-modifier-border)";
      input.style.background = "var(--background-modifier-form-field)";
      input.style.color = "var(--text-normal)";
      input.addEventListener("change", async () => {
        const num = Math.max(1, Math.round(Number(input.value)));
        this.plugin.settings.thresholds[idx] = num;
        // 自动修正递增顺序
        for (let i = 1; i < this.plugin.settings.thresholds.length; i++) {
          if (this.plugin.settings.thresholds[i] <= this.plugin.settings.thresholds[i - 1]) {
            this.plugin.settings.thresholds[i] = this.plugin.settings.thresholds[i - 1] + 50;
          }
        }
        await this.plugin.saveSettings();
        this.display(); // 刷新显示修正后的值
      });
    });
  }
}
