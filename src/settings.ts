import { App, PluginSettingTab, Setting } from "obsidian";
import DiaryHeatmapPlugin from "./main";

export interface HeatmapSettings {
  thresholds: number[];
  colors: string[];
  darkColors: string[];
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
  colors: ["#ddf4e0", "#9be9a8", "#40c463", "#216e39", "#0e4429", "#052814"],
  darkColors: ["#0e4429", "#006d32", "#26a641", "#39d353", "#56d364", "#7ee787"],
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
          .setValue(String(this.plugin.settings.weekStart))
          .onChange(async (value) => {
            this.plugin.settings.weekStart = parseInt(value);
            await this.plugin.saveSettings();
            window.moment.updateLocale(window.moment.locale(), {
              week: { dow: parseInt(value) },
            });
            // 刷新所有打开的 Calendar Pro 视图
            const leaves = this.plugin.app.workspace.getLeavesOfType("diary-heatmap-view");
            leaves.forEach((leaf) => {
              const view = leaf.view as any;
              if (view.debouncedRefresh) {
                view.debouncedRefresh();
              }
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

    // 热力图字数阈值与颜色设置
    containerEl.createEl("h3", { text: "热力图档位设置" });
    const thresholdDesc = containerEl.createEl("p", {
      text: "每行设置一个档位的字数阈值和对应颜色（需递增）",
      cls: "setting-item-description",
    });
    thresholdDesc.style.marginBottom = "12px";

    const rowLabels = [
      "第 1 档（≤ N 字）",
      "第 2 档（≤ N 字）",
      "第 3 档（≤ N 字）",
      "第 4 档（≤ N 字）",
      "第 5 档（≤ N 字）",
      "第 6 档（> N 字）",
    ];

    rowLabels.forEach((label, idx) => {
      const isLast = idx === rowLabels.length - 1;
      const row = containerEl.createDiv();
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      row.style.marginBottom = "8px";
      row.style.padding = "6px 8px";
      row.style.borderRadius = "6px";
      row.style.background = "var(--background-modifier-form-field)";
      row.style.border = "1px solid var(--background-modifier-border)";

      // 标签
      row.createEl("span", {
        text: label,
        cls: "setting-item-name",
      }).style.fontSize = "12px";
      row.createEl("span").style.flex = "1";

      if (!isLast) {
        // 阈值输入
        const numInput = row.createEl("input", {
          type: "number",
          value: String(this.plugin.settings.thresholds[idx] || 50),
        });
        numInput.style.width = "70px";
        numInput.style.padding = "3px 6px";
        numInput.style.borderRadius = "4px";
        numInput.style.border = "1px solid var(--background-modifier-border)";
        numInput.style.background = "var(--background-primary)";
        numInput.style.color = "var(--text-normal)";
        numInput.addEventListener("change", async () => {
          const num = Math.max(1, Math.round(Number(numInput.value)));
          this.plugin.settings.thresholds[idx] = num;
          // 自动修正递增顺序
          for (let i = 1; i < this.plugin.settings.thresholds.length; i++) {
            if (this.plugin.settings.thresholds[i] <= this.plugin.settings.thresholds[i - 1]) {
              this.plugin.settings.thresholds[i] = this.plugin.settings.thresholds[i - 1] + 50;
            }
          }
          await this.plugin.saveSettings();
          this.display();
        });
      }

      // 浅色颜色选择器（太阳图标）
      const lightColorBox = row.createDiv();
      lightColorBox.style.display = "flex";
      lightColorBox.style.alignItems = "center";
      lightColorBox.style.gap = "3px";
      lightColorBox.style.flexShrink = "0";
      const lightLabel = lightColorBox.createEl("span", { text: "☀" });
      lightLabel.style.fontSize = "10px";
      const lightColorInput = lightColorBox.createEl("input", {
        type: "color",
        value: this.plugin.settings.colors[idx] || "#999",
      });
      lightColorInput.style.width = "28px";
      lightColorInput.style.height = "22px";
      lightColorInput.style.padding = "0";
      lightColorInput.style.border = "none";
      lightColorInput.style.background = "none";
      lightColorInput.style.cursor = "pointer";
      lightColorInput.addEventListener("input", async () => {
        this.plugin.settings.colors[idx] = lightColorInput.value;
        await this.plugin.saveSettings();
      });

      // 深色颜色选择器（月亮图标）
      const darkColorBox = row.createDiv();
      darkColorBox.style.display = "flex";
      darkColorBox.style.alignItems = "center";
      darkColorBox.style.gap = "3px";
      darkColorBox.style.flexShrink = "0";
      const darkLabel = darkColorBox.createEl("span", { text: "☾" });
      darkLabel.style.fontSize = "10px";
      const darkColorInput = darkColorBox.createEl("input", {
        type: "color",
        value: this.plugin.settings.darkColors[idx] || "#999",
      });
      darkColorInput.style.width = "28px";
      darkColorInput.style.height = "22px";
      darkColorInput.style.padding = "0";
      darkColorInput.style.border = "none";
      darkColorInput.style.background = "none";
      darkColorInput.style.cursor = "pointer";
      darkColorInput.addEventListener("input", async () => {
        this.plugin.settings.darkColors[idx] = darkColorInput.value;
        await this.plugin.saveSettings();
      });
    });

    // 重置为默认按钮
    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("重置为默认绿色主题")
        .onClick(async () => {
          this.plugin.settings.colors = [...DEFAULT_SETTINGS.colors];
          this.plugin.settings.darkColors = [...DEFAULT_SETTINGS.darkColors];
          this.plugin.settings.thresholds = [...DEFAULT_SETTINGS.thresholds];
          await this.plugin.saveSettings();
          this.display();
        })
    );
  }
}
