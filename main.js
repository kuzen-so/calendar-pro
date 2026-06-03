/* Diary Heatmap Plugin */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DiaryHeatmapPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  thresholds: [50, 150, 300, 500, 800],
  colors: ["#ddf4e0", "#9be9a8", "#40c463", "#216e39", "#0e4429", "#052814"],
  darkColors: ["#0e4429", "#006d32", "#26a641", "#39d353", "#56d364", "#7ee787"],
  defaultYear: "current",
  customFolder: "",
  customFormat: "YYYY-MM-DD",
  useCustomConfig: false,
  weeklyFolder: "",
  weekStart: 1,
  showWeekNumbers: true
};
var HeatmapSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Calendar Pro \u8BBE\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u4F7F\u7528\u81EA\u5B9A\u4E49\u65E5\u8BB0\u914D\u7F6E").setDesc("\u5982\u679C\u672A\u542F\u7528 Daily Notes \u63D2\u4EF6\uFF0C\u6216\u60F3\u8986\u76D6\u5176\u914D\u7F6E\uFF0C\u8BF7\u5F00\u542F\u6B64\u9009\u9879").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.useCustomConfig).onChange(async (value) => {
        this.plugin.settings.useCustomConfig = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    if (this.plugin.settings.useCustomConfig) {
      new import_obsidian.Setting(containerEl).setName("\u65E5\u8BB0\u6587\u4EF6\u5939").setDesc("\u65E5\u8BB0\u5B58\u653E\u7684\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u7559\u7A7A\u8868\u793A\u6839\u76EE\u5F55").addText(
        (text) => text.setPlaceholder("\u4F8B\u5982: Journal \u6216 \u65E5\u8BB0").setValue(this.plugin.settings.customFolder).onChange(async (value) => {
          this.plugin.settings.customFolder = value;
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian.Setting(containerEl).setName("\u65E5\u671F\u683C\u5F0F").setDesc("\u65E5\u8BB0\u6587\u4EF6\u7684\u65E5\u671F\u683C\u5F0F\uFF08moment.js \u683C\u5F0F\uFF09").addText(
        (text) => text.setPlaceholder("YYYY-MM-DD").setValue(this.plugin.settings.customFormat).onChange(async (value) => {
          this.plugin.settings.customFormat = value || "YYYY-MM-DD";
          await this.plugin.saveSettings();
        })
      );
    }
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u663E\u793A\u5E74\u4EFD").setDesc("\u6253\u5F00\u70ED\u529B\u56FE\u65F6\u9ED8\u8BA4\u663E\u793A\u7684\u65F6\u95F4\u8303\u56F4").addDropdown(
      (dropdown) => dropdown.addOption("current", "\u5F53\u5E74\u5B8C\u6574\u5E74\u4EFD").addOption("recent", "\u8FD1\u4E00\u5E74").setValue(this.plugin.settings.defaultYear).onChange(async (value) => {
        this.plugin.settings.defaultYear = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u5468\u8BB0\u6587\u4EF6\u5939").setDesc("\u5468\u8BB0\u5B58\u653E\u7684\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u7559\u7A7A\u5219\u4E0E\u65E5\u8BB0\u5171\u7528\u540C\u4E00\u6587\u4EF6\u5939").addText(
      (text) => text.setPlaceholder("\u4F8B\u5982: Weekly \u6216 \u5468\u8BB0").setValue(this.plugin.settings.weeklyFolder).onChange(async (value) => {
        this.plugin.settings.weeklyFolder = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u5468\u5F00\u59CB\u65E5").setDesc("\u65E5\u5386\u89C6\u56FE\u4EE5\u661F\u671F\u51E0\u4F5C\u4E3A\u4E00\u5468\u7684\u5F00\u59CB").addDropdown(
      (dropdown) => dropdown.addOption("0", "\u5468\u65E5").addOption("1", "\u5468\u4E00").setValue(String(this.plugin.settings.weekStart)).onChange(async (value) => {
        this.plugin.settings.weekStart = parseInt(value);
        await this.plugin.saveSettings();
        window.moment.updateLocale(window.moment.locale(), {
          week: { dow: parseInt(value) }
        });
        const leaves = this.plugin.app.workspace.getLeavesOfType("diary-heatmap-view");
        leaves.forEach((leaf) => {
          const view = leaf.view;
          if (view.debouncedRefresh) {
            view.debouncedRefresh();
          }
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u5C55\u73B0\u5468\u6570").setDesc("\u5728\u65E5\u5386\u89C6\u56FE\u5DE6\u4FA7\u663E\u793A\u5468\u6570\u6807\u7B7E").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showWeekNumbers).onChange(async (value) => {
        this.plugin.settings.showWeekNumbers = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "\u70ED\u529B\u56FE\u6863\u4F4D\u8BBE\u7F6E" });
    const thresholdDesc = containerEl.createEl("p", {
      text: "\u6BCF\u884C\u8BBE\u7F6E\u4E00\u4E2A\u6863\u4F4D\u7684\u5B57\u6570\u9608\u503C\u548C\u5BF9\u5E94\u989C\u8272\uFF08\u9700\u9012\u589E\uFF09",
      cls: "setting-item-description"
    });
    thresholdDesc.style.marginBottom = "12px";
    const rowLabels = [
      "\u7B2C 1 \u6863\uFF08\u2264 N \u5B57\uFF09",
      "\u7B2C 2 \u6863\uFF08\u2264 N \u5B57\uFF09",
      "\u7B2C 3 \u6863\uFF08\u2264 N \u5B57\uFF09",
      "\u7B2C 4 \u6863\uFF08\u2264 N \u5B57\uFF09",
      "\u7B2C 5 \u6863\uFF08\u2264 N \u5B57\uFF09",
      "\u7B2C 6 \u6863\uFF08> N \u5B57\uFF09"
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
      row.createEl("span", {
        text: label,
        cls: "setting-item-name"
      }).style.fontSize = "12px";
      row.createEl("span").style.flex = "1";
      if (!isLast) {
        const numInput = row.createEl("input", {
          type: "number",
          value: String(this.plugin.settings.thresholds[idx] || 50)
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
          for (let i = 1; i < this.plugin.settings.thresholds.length; i++) {
            if (this.plugin.settings.thresholds[i] <= this.plugin.settings.thresholds[i - 1]) {
              this.plugin.settings.thresholds[i] = this.plugin.settings.thresholds[i - 1] + 50;
            }
          }
          await this.plugin.saveSettings();
          this.display();
        });
      }
      const lightColorBox = row.createDiv();
      lightColorBox.style.display = "flex";
      lightColorBox.style.alignItems = "center";
      lightColorBox.style.gap = "3px";
      lightColorBox.style.flexShrink = "0";
      const lightLabel = lightColorBox.createEl("span", { text: "\u2600" });
      lightLabel.style.fontSize = "10px";
      const lightColorInput = lightColorBox.createEl("input", {
        type: "color",
        value: this.plugin.settings.colors[idx] || "#999"
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
      const darkColorBox = row.createDiv();
      darkColorBox.style.display = "flex";
      darkColorBox.style.alignItems = "center";
      darkColorBox.style.gap = "3px";
      darkColorBox.style.flexShrink = "0";
      const darkLabel = darkColorBox.createEl("span", { text: "\u263E" });
      darkLabel.style.fontSize = "10px";
      const darkColorInput = darkColorBox.createEl("input", {
        type: "color",
        value: this.plugin.settings.darkColors[idx] || "#999"
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
    new import_obsidian.Setting(containerEl).addButton(
      (btn) => btn.setButtonText("\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u7EFF\u8272\u4E3B\u9898").onClick(async () => {
        this.plugin.settings.colors = [...DEFAULT_SETTINGS.colors];
        this.plugin.settings.darkColors = [...DEFAULT_SETTINGS.darkColors];
        this.plugin.settings.thresholds = [...DEFAULT_SETTINGS.thresholds];
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};

// src/ui/heatmap-view.ts
var import_obsidian7 = require("obsidian");

// src/services/diary-service.ts
var import_obsidian4 = require("obsidian");

// src/utils/daily-notes-config.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_CONFIG = {
  folder: "",
  format: "YYYY-MM-DD",
  template: ""
};
async function getDailyNotesConfig(app) {
  try {
    const configPath = (0, import_obsidian2.normalizePath)(".obsidian/daily-notes.json");
    if (await app.vault.adapter.exists(configPath)) {
      const content = await app.vault.adapter.read(configPath);
      const config = JSON.parse(content);
      return {
        folder: config.folder || "",
        format: config.format || "YYYY-MM-DD",
        template: config.template || ""
      };
    }
  } catch (e) {
    console.error("[Diary Heatmap] Failed to read daily-notes config:", e);
  }
  try {
    const calendarConfigPath = (0, import_obsidian2.normalizePath)(".obsidian/calendar-plugin.json");
    if (await app.vault.adapter.exists(calendarConfigPath)) {
      const content = await app.vault.adapter.read(calendarConfigPath);
      const config = JSON.parse(content);
      return {
        folder: config.dailyNotesFolder || "",
        format: config.dailyNoteFormat || "YYYY-MM-DD",
        template: ""
      };
    }
  } catch (e) {
    console.error("[Diary Heatmap] Failed to read calendar-plugin config:", e);
  }
  return { ...DEFAULT_CONFIG };
}
function getDateFormat(config) {
  return config.format || "YYYY-MM-DD";
}
function getFolderPath(config) {
  return config.folder ? (0, import_obsidian2.normalizePath)(config.folder) : "";
}
function getDiaryFilePath(date, config) {
  const folder = getFolderPath(config);
  const format = getDateFormat(config);
  const fileName = date.format(format) + ".md";
  return folder ? (0, import_obsidian2.normalizePath)(`${folder}/${fileName}`) : fileName;
}
async function readTemplateContent(app, templatePath) {
  if (!templatePath) return "";
  try {
    const normalized = (0, import_obsidian2.normalizePath)(templatePath);
    if (await app.vault.adapter.exists(normalized)) {
      return await app.vault.adapter.read(normalized);
    }
  } catch (e) {
    console.error("[Diary Heatmap] Failed to read template:", e);
    new import_obsidian2.Notice("\u65E5\u8BB0\u6A21\u677F\u8BFB\u53D6\u5931\u8D25");
  }
  return "";
}

// src/ui/confirm-modal.ts
var import_obsidian3 = require("obsidian");
var ConfirmModal = class extends import_obsidian3.Modal {
  constructor(app, message, onConfirm) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });
    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container"
    });
    new import_obsidian3.ButtonComponent(buttonContainer).setButtonText("\u53D6\u6D88").onClick(() => {
      this.close();
    });
    new import_obsidian3.ButtonComponent(buttonContainer).setButtonText("\u521B\u5EFA").setCta().onClick(() => {
      this.onConfirm();
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/services/diary-service.ts
var DiaryService = class {
  constructor(app, plugin, cache, onRefresh) {
    this.app = app;
    this.plugin = plugin;
    this.cache = cache;
    this.onRefresh = onRefresh;
  }
  openDiary(filePath) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian4.TFile) {
      this.app.workspace.getLeaf().openFile(file);
    }
  }
  async createDiary(dateStr) {
    const config = await this.plugin.getEffectiveConfig();
    const date = window.moment(dateStr, "YYYY-MM-DD");
    const filePath = getDiaryFilePath(date, config);
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof import_obsidian4.TFile) {
      this.app.workspace.getLeaf().openFile(existing);
      return;
    }
    const formattedDate = date.format("YYYY\u5E74M\u6708D\u65E5");
    new ConfirmModal(
      this.app,
      `\u662F\u5426\u521B\u5EFA ${formattedDate} \u7684\u65E5\u8BB0\uFF1F`,
      async () => {
        try {
          let content = "";
          if (config.template) {
            content = await readTemplateContent(this.app, config.template);
          }
          const dayOfWeek = date.format("dddd");
          content = content.replace(/\{\{date\}\}/g, formattedDate).replace(/\{\{title\}\}/g, formattedDate).replace(/\{\{time\}\}/g, date.format("HH:mm")).replace(/\{\{date:([^}]+)\}\}/g, (_, fmt) => date.format(fmt)).replace(/\{\{time:([^}]+)\}\}/g, (_, fmt) => date.format(fmt)).replace(/\{\{yesterday\}\}/g, date.clone().subtract(1, "day").format("YYYY\u5E74M\u6708D\u65E5")).replace(/\{\{tomorrow\}\}/g, date.clone().add(1, "day").format("YYYY\u5E74M\u6708D\u65E5"));
          if (!content.trim()) {
            content = "";
          }
          const folder = getFolderPath(config);
          if (folder && !await this.app.vault.adapter.exists(folder)) {
            await this.app.vault.createFolder(folder);
          }
          const newFile = await this.app.vault.create(filePath, content);
          this.app.workspace.getLeaf().openFile(newFile);
          new import_obsidian4.Notice(`\u5DF2\u521B\u5EFA\u65E5\u8BB0: ${formattedDate}`);
        } catch (e) {
          console.error(`[Diary Heatmap] Failed to create diary:`, e);
          new import_obsidian4.Notice("\u521B\u5EFA\u65E5\u8BB0\u5931\u8D25");
        }
      }
    ).open();
  }
  async openOrCreateWeeklyDiary(year, week) {
    const { filePath, folder } = await this.getWeeklyFileInfo(year, week);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian4.TFile) {
      this.app.workspace.getLeaf().openFile(file);
      return;
    }
    new ConfirmModal(
      this.app,
      `\u662F\u5426\u521B\u5EFA ${year}\u5E74\u7B2C${week}\u5468\u7684\u5468\u8BB0\uFF1F`,
      async () => {
        try {
          const content = "";
          if (folder && !await this.app.vault.adapter.exists(folder)) {
            await this.app.vault.createFolder(folder);
          }
          const newFile = await this.app.vault.create(filePath, content);
          this.app.workspace.getLeaf().openFile(newFile);
          new import_obsidian4.Notice(`\u5DF2\u521B\u5EFA\u5468\u8BB0: ${year}\u5E74\u7B2C${week}\u5468`);
        } catch (e) {
          console.error(`[Diary Heatmap] Failed to create weekly note:`, e);
          new import_obsidian4.Notice("\u521B\u5EFA\u5468\u8BB0\u5931\u8D25");
        }
      }
    ).open();
  }
  showCalendarContextMenu(evt, dayData) {
    const file = this.app.vault.getAbstractFileByPath(dayData.filePath);
    if (!(file instanceof import_obsidian4.TFile)) return;
    const menu = new import_obsidian4.Menu();
    menu.addItem(
      (item) => item.setTitle("\u6253\u5F00\u65E5\u8BB0").setIcon("file-text").onClick(() => this.openDiary(dayData.filePath))
    );
    menu.addItem(
      (item) => item.setTitle("\u590D\u5236\u8DEF\u5F84").setIcon("copy").onClick(() => {
        navigator.clipboard.writeText(dayData.filePath);
        new import_obsidian4.Notice("\u8DEF\u5F84\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
      })
    );
    menu.addSeparator();
    menu.addItem(
      (item) => item.setTitle("\u5220\u9664\u65E5\u8BB0").setIcon("trash").onClick(async () => {
        await this.app.fileManager.trashFile(file);
        this.cache.invalidate(dayData.filePath);
        this.onRefresh();
        new import_obsidian4.Notice("\u65E5\u8BB0\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9");
      })
    );
    menu.showAtMouseEvent(evt);
  }
  async showWeeklyContextMenu(evt, year, week) {
    const { filePath } = await this.getWeeklyFileInfo(year, week);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian4.TFile) {
      const menu = new import_obsidian4.Menu();
      menu.addItem(
        (item) => item.setTitle("\u6253\u5F00\u5468\u8BB0").setIcon("file-text").onClick(() => this.openDiary(filePath))
      );
      menu.addItem(
        (item) => item.setTitle("\u590D\u5236\u8DEF\u5F84").setIcon("copy").onClick(() => {
          navigator.clipboard.writeText(filePath);
          new import_obsidian4.Notice("\u8DEF\u5F84\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
        })
      );
      menu.addSeparator();
      menu.addItem(
        (item) => item.setTitle("\u5220\u9664\u5468\u8BB0").setIcon("trash").onClick(async () => {
          await this.app.fileManager.trashFile(file);
          this.onRefresh();
          new import_obsidian4.Notice("\u5468\u8BB0\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9");
        })
      );
      menu.showAtMouseEvent(evt);
    } else {
      const menu = new import_obsidian4.Menu();
      menu.addItem(
        (item) => item.setTitle("\u521B\u5EFA\u5468\u8BB0").setIcon("plus").onClick(() => this.openOrCreateWeeklyDiary(year, week))
      );
      menu.showAtMouseEvent(evt);
    }
  }
  async getWeeklyFileInfo(year, week) {
    const weeklyFolder = this.plugin.settings.weeklyFolder ? (0, import_obsidian4.normalizePath)(this.plugin.settings.weeklyFolder) : "";
    const config = await this.plugin.getEffectiveConfig();
    const diaryFolder = getFolderPath(config);
    const folder = weeklyFolder || diaryFolder;
    const fileName = `${year}-\u7B2C${week}\u5468.md`;
    const filePath = folder ? (0, import_obsidian4.normalizePath)(`${folder}/${fileName}`) : fileName;
    return { filePath, folder };
  }
};

// src/ui/renderers/heatmap-renderer.ts
var import_obsidian6 = require("obsidian");

// src/utils/heatmap-data.ts
var import_obsidian5 = require("obsidian");
function countWords(content) {
  let text = content;
  if (text.startsWith("---")) {
    const end = text.indexOf("---", 3);
    if (end !== -1) {
      text = text.slice(end + 3).trimStart();
    }
  }
  const cleanText = text.replace(/[#*\-\[\]\(\)!|`>_]/g, "").replace(/\s+/g, " ").trim();
  const chineseChars = (cleanText.match(/[一-鿿]/g) || []).length;
  const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}
function getHeatLevel(wordCount, thresholds) {
  if (wordCount === 0) return 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (wordCount <= thresholds[i]) return i + 1;
  }
  return thresholds.length + 1;
}
var DataCache = class {
  constructor(app) {
    this.app = app;
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * 使指定路径的缓存失效
   */
  invalidate(filePath) {
    this.cache.delete(filePath);
  }
  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
  }
  /**
   * 获取指定日期的日记数据（带缓存）
   */
  async getDayData(date, config) {
    const filePath = getDiaryFilePath(date, config);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof import_obsidian5.TFile)) {
      if (this.cache.has(filePath)) {
        this.cache.delete(filePath);
      }
      return { wordCount: 0, exists: false, filePath };
    }
    const cached = this.cache.get(filePath);
    if (cached && cached.mtime === file.stat.mtime) {
      return { wordCount: cached.wordCount, exists: true, filePath };
    }
    try {
      const content = await this.app.vault.read(file);
      const wordCount = countWords(content);
      this.cache.set(filePath, { wordCount, mtime: file.stat.mtime });
      return { wordCount, exists: true, filePath };
    } catch (e) {
      console.error(`[Diary Heatmap] Failed to read ${filePath}:`, e);
      return { wordCount: 0, exists: true, filePath };
    }
  }
  /**
   * 批量获取日期范围的数据
   * 优化：使用 Promise.all 并行加载，避免顺序 await 导致的一年 365 次串行 IO
   */
  async getRangeData(config, start, end, yearFilter) {
    const dates = [];
    const current = start.clone();
    while (current.isSameOrBefore(end, "day")) {
      const dateStr = current.format("YYYY-MM-DD");
      const inYear = yearFilter !== void 0 ? current.year() === yearFilter : true;
      dates.push({ date: current.clone(), dateStr, inYear });
      current.add(1, "day");
    }
    const results = await Promise.all(
      dates.map(async ({ date, dateStr, inYear }) => {
        if (inYear) {
          const { wordCount, exists, filePath } = await this.getDayData(date, config);
          return { date: dateStr, wordCount, exists, filePath, inYear };
        } else {
          const filePath = getDiaryFilePath(date, config);
          return { date: dateStr, wordCount: 0, exists: false, filePath, inYear: false };
        }
      })
    );
    return results;
  }
};
function getWeekBoundary(date, weekStart, isEnd) {
  const day = date.day();
  const diff = (day - weekStart + 7) % 7;
  const start = date.clone().subtract(diff, "days");
  if (isEnd) {
    return start.add(6, "days");
  }
  return start;
}
async function getYearHeatmapData(cache, config, year, weekStart = 1) {
  const startOfYear = window.moment(`${year}-01-01`, "YYYY-MM-DD");
  const endOfYear = window.moment(`${year}-12-31`, "YYYY-MM-DD");
  const start = getWeekBoundary(startOfYear, weekStart, false);
  const end = getWeekBoundary(endOfYear, weekStart, true);
  return cache.getRangeData(config, start, end, year);
}
async function getRecentYearHeatmapData(cache, config, weekStart = 1) {
  const endDate = window.moment();
  const startDate = endDate.clone().subtract(1, "year").add(1, "day");
  const start = getWeekBoundary(startDate, weekStart, false);
  const end = getWeekBoundary(endDate, weekStart, true);
  return cache.getRangeData(config, start, end);
}
async function getMonthHeatmapData(cache, config, year, month, weekStart = 1) {
  const startOfMonth = window.moment([year, month]);
  const endOfMonth = startOfMonth.clone().endOf("month");
  const start = getWeekBoundary(startOfMonth, weekStart, false);
  let end = getWeekBoundary(endOfMonth, weekStart, true);
  const minDays = 42;
  const actualDays = end.diff(start, "days") + 1;
  if (actualDays < minDays) {
    end = end.clone().add(minDays - actualDays, "days");
  }
  return cache.getRangeData(config, start, end);
}

// src/ui/renderers/heatmap-renderer.ts
var HeatmapRenderer = class {
  constructor(app, diaryService) {
    this.app = app;
    this.diaryService = diaryService;
  }
  render(container, footer, data, year, thresholds, colors, darkColors, weeklyFolder, containerWidth) {
    const isDark = document.body.classList.contains("theme-dark");
    const activeColors = isDark ? darkColors : colors;
    container.empty();
    footer.empty();
    const wrapper = container.createDiv("diary-heatmap-grid-wrapper");
    const now = window.moment();
    let topStatsText = "";
    if (year === now.year()) {
      const endOfYear = window.moment(`${year}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
      const remainingMonths = Math.max(0, endOfYear.diff(now, "months"));
      const remainingDays = Math.max(0, endOfYear.diff(now, "days"));
      const remainingHours = Math.max(0, endOfYear.diff(now, "hours"));
      topStatsText = `\u672C\u5E74\u5EA6\u5269\u4F59 ${remainingMonths} \u6708 \xB7 ${remainingDays} \u5929 \xB7 ${remainingHours} \u5C0F\u65F6`;
    } else if (year < now.year()) {
      const endOfYear = window.moment(`${year}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
      const passedDays = Math.max(0, now.diff(endOfYear, "days"));
      topStatsText = `\u8DDD\u79BB ${year} \u5E74\u5DF2\u8FC7\u53BB ${passedDays} \u5929`;
    } else {
      const startOfYear = window.moment(`${year}-01-01 00:00:00`, "YYYY-MM-DD HH:mm:ss");
      const remainingDays = Math.max(0, startOfYear.diff(now, "days"));
      topStatsText = `\u8DDD\u79BB ${year} \u5E74\u8FD8\u6709 ${remainingDays} \u5929`;
    }
    const topStats = wrapper.createDiv("diary-heatmap-top-stats");
    topStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: topStatsText
    });
    const grid = wrapper.createDiv("diary-heatmap-grid");
    const cellTotal = 14;
    const maxCols = Math.max(1, Math.floor(containerWidth / cellTotal));
    const totalCells = data.length;
    const minRows = 1;
    const maxRows = 20;
    let cols = maxCols;
    let rows = Math.ceil(totalCells / cols);
    if (rows > maxRows) {
      cols = Math.ceil(totalCells / maxRows);
      rows = maxRows;
    }
    if (rows < minRows) {
      cols = Math.ceil(totalCells / minRows);
      rows = minRows;
    }
    grid.style.gridTemplateColumns = `repeat(${cols}, 12px)`;
    grid.style.gridAutoFlow = "row";
    const monthFirstIndices = /* @__PURE__ */ new Map();
    data.forEach((day, index) => {
      if (day.date) {
        const month = window.moment(day.date).month();
        if (!monthFirstIndices.has(month)) {
          monthFirstIndices.set(month, index);
        }
      }
    });
    const fragment = document.createDocumentFragment();
    const isCurrentYear = year === now.year();
    data.forEach((day, index) => {
      const cell = document.createElement("div");
      cell.className = "diary-heatmap-cell";
      const level = getHeatLevel(day.wordCount, thresholds);
      cell.classList.add(`level-${level}`);
      if (level > 0 && activeColors[level - 1]) {
        cell.style.backgroundColor = activeColors[level - 1];
      }
      cell.setAttribute("data-date", day.date);
      cell.setAttribute("data-count", String(day.wordCount));
      if (day.date) {
        const month = window.moment(day.date).month();
        if (monthFirstIndices.get(month) === index) {
          const monthBadge = document.createElement("span");
          monthBadge.className = "diary-heatmap-month-badge";
          if (!isCurrentYear || month !== now.month()) {
            monthBadge.classList.add("dimmed");
          }
          monthBadge.textContent = String(month + 1);
          cell.appendChild(monthBadge);
        }
      }
      const dateStr = day.date ? window.moment(day.date).format("M\u6708D\u65E5 dddd") : "";
      cell.setAttribute("data-tip", `${dateStr}: ${day.wordCount}\u5B57`);
      if (day.inYear === false) {
        cell.classList.add("out-of-year");
      } else if (day.exists) {
        cell.classList.add("has-diary");
        cell.addEventListener("click", () => {
          this.diaryService.openDiary(day.filePath);
        });
      } else if (day.date) {
        cell.classList.add("no-diary");
        cell.addEventListener("click", () => {
          this.diaryService.createDiary(day.date);
        });
      } else {
        cell.classList.add("empty-cell");
      }
      fragment.appendChild(cell);
    });
    const totalGridCells = cols * rows;
    for (let i = data.length; i < totalGridCells; i++) {
      const cell = document.createElement("div");
      cell.className = "diary-heatmap-cell empty-cell";
      fragment.appendChild(cell);
    }
    grid.appendChild(fragment);
    const yearStats = data.reduce(
      (acc, d) => {
        if (d.exists && d.date && window.moment(d.date).year() === year) {
          acc.diaryCount++;
          acc.totalWords += d.wordCount;
        }
        return acc;
      },
      { diaryCount: 0, totalWords: 0 }
    );
    const weeklyCount = this.countWeeklyNotes(year, weeklyFolder);
    const hasAnyDiary = data.some((d) => d.exists);
    if (!hasAnyDiary) {
      const emptyTip = wrapper.createDiv("diary-heatmap-empty-tip");
      emptyTip.setText("\u6682\u65E0\u65E5\u8BB0\uFF0C\u70B9\u51FB\u4EFB\u610F\u65E5\u671F\u5F00\u59CB\u8BB0\u5F55");
    }
    const bottomStats = wrapper.createDiv("diary-heatmap-bottom-stats");
    bottomStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: `\u672C\u5E74\u5EA6\u5171\u5199 ${yearStats.diaryCount} \u7BC7\u65E5\u8BB0 \u2022 ${weeklyCount} \u7BC7\u5468\u8BB0 \u2022 \u5171\u8BA1 ${yearStats.totalWords} \u5B57`
    });
    const legendRow = wrapper.createDiv("diary-heatmap-legend-row");
    legendRow.createSpan({ cls: "diary-heatmap-legend-label", text: "\u5C11" });
    const legendCells = legendRow.createDiv("diary-heatmap-legend-cells");
    for (let i = 1; i <= 6; i++) {
      const cell = legendCells.createDiv("diary-heatmap-cell legend-cell");
      if (activeColors[i - 1]) {
        cell.style.backgroundColor = activeColors[i - 1];
      }
    }
    legendRow.createSpan({ cls: "diary-heatmap-legend-label", text: "\u591A" });
    footer.appendChild(wrapper);
  }
  countWeeklyNotes(year, weeklyFolder) {
    const prefix = `${year}-\u7B2C`;
    const suffix = "\u5468.md";
    if (weeklyFolder) {
      const folder = this.app.vault.getAbstractFileByPath(weeklyFolder);
      if (folder instanceof import_obsidian6.TFolder) {
        let count = 0;
        for (const child of folder.children) {
          if (child instanceof import_obsidian6.TFile && child.extension === "md") {
            const name = child.name;
            if (name.startsWith(prefix) && name.endsWith(suffix)) {
              count++;
            }
          }
        }
        return count;
      }
    }
    const weeklyPattern = new RegExp(`^${year}-\u7B2C\\d{1,2}\u5468\\.md$`);
    return this.app.vault.getFiles().filter(
      (f) => weeklyPattern.test(f.name)
    ).length;
  }
};

// src/ui/renderers/calendar-renderer.ts
var CalendarRenderer = class {
  constructor(diaryService) {
    this.diaryService = diaryService;
  }
  render(container, data, calendarDate, showWeekNumbers, weeklyExistsInMonth, weeklyWordCounts, thresholds, weekStart) {
    container.empty();
    const wrapper = container.createDiv("diary-heatmap-calendar-wrapper");
    const allWeekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekDays = [
      ...allWeekDays.slice(weekStart),
      ...allWeekDays.slice(0, weekStart)
    ];
    const headerRow = wrapper.createDiv("diary-heatmap-calendar-header");
    if (showWeekNumbers) {
      headerRow.createDiv("diary-heatmap-calendar-header-spacer");
    }
    weekDays.forEach((d) => {
      headerRow.createDiv("diary-heatmap-calendar-weekday").setText(d);
    });
    const gridArea = wrapper.createDiv("diary-heatmap-calendar-grid-area");
    if (!showWeekNumbers) {
      gridArea.classList.add("no-week-numbers");
    }
    const weeks = this.groupByWeeks(data);
    const fragment = document.createDocumentFragment();
    weeks.forEach((week) => {
      const firstDayOfWeek = week.find((d) => d.date);
      let weekNum = 0;
      if (firstDayOfWeek) {
        weekNum = window.moment(firstDayOfWeek.date).week();
      }
      if (showWeekNumbers) {
        const weekLabelEl = document.createElement("div");
        weekLabelEl.className = "diary-heatmap-calendar-week-label";
        if (weekNum > 0) {
          weekLabelEl.classList.add("week-number");
          weekLabelEl.setAttribute("data-week-num", String(weekNum));
          weekLabelEl.textContent = String(weekNum);
          weekLabelEl.addEventListener("click", () => {
            this.diaryService.openOrCreateWeeklyDiary(
              calendarDate.year(),
              weekNum
            );
          });
          weekLabelEl.addEventListener("contextmenu", (evt) => {
            evt.preventDefault();
            this.diaryService.showWeeklyContextMenu(
              evt,
              calendarDate.year(),
              weekNum
            );
          });
          if (weeklyExistsInMonth.has(weekNum)) {
            const wordCount = weeklyWordCounts.get(weekNum) || 0;
            const dots = this.getWeeklyDots(wordCount, thresholds);
            const dotContainer = document.createElement("div");
            dotContainer.className = "weekly-dots";
            dots.forEach((isSolid) => {
              const dot = document.createElement("span");
              dot.className = isSolid ? "weekly-dot solid" : "weekly-dot";
              dotContainer.appendChild(dot);
            });
            weekLabelEl.appendChild(dotContainer);
          }
        }
        fragment.appendChild(weekLabelEl);
      }
      week.forEach((dayData) => {
        const cell = document.createElement("div");
        cell.className = "diary-heatmap-calendar-cell";
        if (!dayData.date) {
          cell.classList.add("empty");
          fragment.appendChild(cell);
          return;
        }
        const date = window.moment(dayData.date);
        const isCurrentMonth = date.month() === calendarDate.month() && date.year() === calendarDate.year();
        const isToday = date.isSame(window.moment(), "day");
        const dayNum = document.createElement("span");
        dayNum.className = "day-number";
        dayNum.textContent = date.format("D");
        cell.appendChild(dayNum);
        if (dayData.exists) {
          const level = getHeatLevel(dayData.wordCount, thresholds);
          cell.classList.add(`level-${level}`, "has-diary");
          cell.setAttribute(
            "data-tip",
            `${date.format("MMM D, dddd")}: ${dayData.wordCount}\u5B57`
          );
          cell.setAttribute("data-file-path", dayData.filePath);
          const dots = this.getWeeklyDots(dayData.wordCount, thresholds);
          const dotContainer = document.createElement("div");
          dotContainer.className = "diary-dots";
          dots.forEach((isSolid) => {
            const dot = document.createElement("span");
            dot.className = isSolid ? "diary-dot solid" : "diary-dot";
            dotContainer.appendChild(dot);
          });
          cell.appendChild(dotContainer);
        } else {
          cell.classList.add("no-diary");
        }
        if (!isCurrentMonth) {
          cell.classList.add("out-of-month");
        }
        if (isToday) {
          cell.classList.add("is-today");
        }
        cell.addEventListener("click", () => {
          if (dayData.exists) {
            this.diaryService.openDiary(dayData.filePath);
          } else {
            this.diaryService.createDiary(dayData.date);
          }
        });
        if (dayData.exists) {
          cell.addEventListener("contextmenu", (evt) => {
            evt.preventDefault();
            this.diaryService.showCalendarContextMenu(evt, dayData);
          });
        }
        fragment.appendChild(cell);
      });
    });
    gridArea.appendChild(fragment);
    const stats = data.reduce(
      (acc, d) => {
        if (!d.date) return acc;
        const date = window.moment(d.date);
        if (date.month() === calendarDate.month() && date.year() === calendarDate.year()) {
          acc.totalWords += d.wordCount;
          if (d.exists) acc.diaryDays++;
        }
        return acc;
      },
      { diaryDays: 0, totalWords: 0 }
    );
    const hasAnyDiary = data.some((d) => d.exists);
    if (!hasAnyDiary) {
      const emptyTip = wrapper.createDiv("diary-heatmap-empty-tip");
      emptyTip.setText("\u672C\u6708\u6682\u65E0\u65E5\u8BB0\uFF0C\u70B9\u51FB\u4EFB\u610F\u65E5\u671F\u5F00\u59CB\u8BB0\u5F55");
    }
    const calendarFooter = wrapper.createDiv(
      "diary-heatmap-calendar-footer"
    );
    calendarFooter.createSpan({
      cls: "diary-heatmap-calendar-footer-text",
      text: `\u672C\u6708\u65E5\u8BB0 ${stats.diaryDays} \u7BC7 \xB7 \u5171\u8BA1 ${stats.totalWords} \u5B57`
    });
  }
  /**
   * 根据字数计算圆点状态
   * 达到阈值显示实心，下一级显示虚线
   * 0字: [空心]
   * >=50: [实心, 空心]
   * >=150: [实心, 实心, 空心]
   * >=300: [实心, 实心, 实心, 空心]
   * >=500: [实心, 实心, 实心, 实心, 空心]
   * >=800: [实心, 实心, 实心, 实心, 实心]
   */
  getWeeklyDots(wordCount, thresholds) {
    const dots = [];
    for (const t of thresholds) {
      if (wordCount >= t) {
        dots.push(true);
      } else {
        dots.push(false);
        break;
      }
    }
    return dots;
  }
  groupByWeeks(data) {
    const weeks = [];
    let currentWeek = [];
    data.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: "",
          wordCount: 0,
          exists: false,
          filePath: ""
        });
      }
      weeks.push(currentWeek);
    }
    const MIN_WEEKS = 6;
    while (weeks.length < MIN_WEEKS) {
      const emptyWeek = [];
      for (let i = 0; i < 7; i++) {
        emptyWeek.push({
          date: "",
          wordCount: 0,
          exists: false,
          filePath: ""
        });
      }
      weeks.push(emptyWeek);
    }
    return weeks;
  }
};

// src/ui/heatmap-view.ts
var VIEW_TYPE_DIARY_HEATMAP = "diary-heatmap-view";
var HeatmapView = class extends import_obsidian7.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.data = [];
    this.refreshTimer = null;
    this.resizeTimer = null;
    this.isLoading = false;
    this.resizeObserver = null;
    this.weeklyExistsInMonth = /* @__PURE__ */ new Set();
    this.weeklyWordCounts = /* @__PURE__ */ new Map();
    this.keydownHandler = null;
    this.plugin = plugin;
    this.currentYear = window.moment().year();
    this.calendarDate = window.moment();
    this.viewMode = "calendar";
    this.cache = new DataCache(this.app);
    this.diaryService = new DiaryService(
      this.app,
      this.plugin,
      this.cache,
      () => this.debouncedRefresh()
    );
    this.heatmapRenderer = new HeatmapRenderer(this.app, this.diaryService);
    this.calendarRenderer = new CalendarRenderer(this.diaryService);
  }
  getViewType() {
    return VIEW_TYPE_DIARY_HEATMAP;
  }
  getDisplayText() {
    return "Calendar Pro";
  }
  getIcon() {
    return "calendar";
  }
  async onOpen() {
    this.containerElRef = this.contentEl.createDiv("diary-heatmap-container");
    this.renderHeader();
    this.loadingEl = this.containerElRef.createDiv("diary-heatmap-loading");
    this.loadingEl.setText("\u52A0\u8F7D\u4E2D...");
    this.contentArea = this.containerElRef.createDiv();
    this.footerArea = this.containerElRef.createDiv();
    await this.loadData();
    if (this.viewMode === "calendar") {
      await this.loadWeeklyExists();
    }
    this.loadingEl.hide();
    this.renderContent();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.viewMode === "heatmap") {
        if (this.resizeTimer) {
          window.clearTimeout(this.resizeTimer);
        }
        this.resizeTimer = window.setTimeout(() => {
          requestAnimationFrame(() => this.renderHeatmapLayout());
        }, 150);
      }
    });
    this.resizeObserver.observe(this.containerElRef);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.highlightActiveDiary();
      })
    );
    this.highlightActiveDiary();
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof import_obsidian7.TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof import_obsidian7.TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian7.TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.containerElRef.setAttribute("tabindex", "0");
    this.keydownHandler = (evt) => {
      if (evt.key === "ArrowLeft") {
        evt.preventDefault();
        if (this.viewMode === "heatmap") {
          this.currentYear--;
        } else {
          this.calendarDate.subtract(1, "month");
        }
        this.debouncedRefresh();
      } else if (evt.key === "ArrowRight") {
        evt.preventDefault();
        if (this.viewMode === "heatmap") {
          this.currentYear++;
        } else {
          this.calendarDate.add(1, "month");
        }
        this.debouncedRefresh();
      }
    };
    this.containerElRef.addEventListener("keydown", this.keydownHandler);
  }
  async onClose() {
    this.clearDebouncedRefresh();
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.keydownHandler && this.containerElRef) {
      this.containerElRef.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    this.contentEl.empty();
  }
  debouncedRefresh() {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = window.setTimeout(() => {
      this.refresh();
    }, 300);
  }
  clearDebouncedRefresh() {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  async refresh() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.loadingEl.show();
    try {
      if (this.monthDisplayEl) {
        this.monthDisplayEl.style.display = "";
        this.monthDisplayEl.setText(this.calendarDate.format("MMM"));
      }
      if (this.yearDisplayEl) {
        this.yearDisplayEl.style.display = "";
        this.yearDisplayEl.setText(
          this.viewMode === "heatmap" ? `${this.currentYear}` : this.calendarDate.format("YYYY")
        );
      }
      if (this.heatmapTab) {
        this.heatmapTab.classList.toggle("active", this.viewMode === "heatmap");
      }
      if (this.calendarTab) {
        this.calendarTab.classList.toggle("active", this.viewMode === "calendar");
      }
      this.updateTodayButtonState();
      this.contentArea.empty();
      this.footerArea.empty();
      await this.loadData();
      if (this.viewMode === "calendar") {
        await this.loadWeeklyExists();
      }
      this.renderContent();
    } catch (e) {
      console.error("[Diary Heatmap] Refresh failed:", e);
    } finally {
      this.loadingEl.hide();
      this.isLoading = false;
    }
  }
  /**
   * 加载当前月份各周是否存在周记及字数
   */
  async loadWeeklyExists() {
    this.weeklyExistsInMonth.clear();
    this.weeklyWordCounts.clear();
    const config = await this.getConfig();
    const weeklyFolder = this.plugin.settings.weeklyFolder ? (0, import_obsidian7.normalizePath)(this.plugin.settings.weeklyFolder) : "";
    const diaryFolder = getFolderPath(config);
    const folder = weeklyFolder || diaryFolder;
    const processedWeeks = /* @__PURE__ */ new Set();
    const readPromises = [];
    this.data.forEach((d) => {
      if (!d.date) return;
      const date = window.moment(d.date);
      const weekNum = date.week();
      if (processedWeeks.has(weekNum)) return;
      processedWeeks.add(weekNum);
      const candidates = [
        `${this.calendarDate.year()}-\u7B2C${weekNum}\u5468.md`
      ];
      const weekYear = date.weekYear();
      if (weekYear !== this.calendarDate.year()) {
        candidates.push(`${weekYear}-\u7B2C${weekNum}\u5468.md`);
      }
      for (const fileName of candidates) {
        const filePath = folder ? (0, import_obsidian7.normalizePath)(`${folder}/${fileName}`) : fileName;
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof import_obsidian7.TFile) {
          this.weeklyExistsInMonth.add(weekNum);
          readPromises.push(
            this.app.vault.read(file).then((content) => {
              this.weeklyWordCounts.set(weekNum, countWords(content));
            }).catch(() => {
            })
          );
          break;
        }
      }
    });
    await Promise.all(readPromises);
  }
  /**
   * 更新 Today 按钮状态：若当前已显示今天，则禁用
   */
  updateTodayButtonState() {
    if (!this.todayBtn) return;
    const now = window.moment();
    let isToday = false;
    if (this.viewMode === "calendar") {
      isToday = this.calendarDate.year() === now.year() && this.calendarDate.month() === now.month();
    } else {
      isToday = this.currentYear === now.year();
    }
    this.todayBtn.toggleClass("is-disabled", isToday);
    this.todayBtn.disabled = isToday;
  }
  getSettings() {
    return this.plugin.settings;
  }
  async getConfig() {
    return await this.plugin.getEffectiveConfig();
  }
  /**
   * 公共方法：跳转到今天（供命令面板调用）
   */
  jumpToToday() {
    this.calendarDate = window.moment();
    this.currentYear = window.moment().year();
    this.debouncedRefresh();
  }
  renderHeader() {
    const header = this.containerElRef.createDiv("diary-heatmap-header");
    const titleRow = header.createDiv("diary-heatmap-title-row");
    const leftGroup = titleRow.createDiv("diary-heatmap-title-group");
    const prevBtn = leftGroup.createEl("button", {
      cls: "diary-heatmap-nav-btn"
    });
    (0, import_obsidian7.setIcon)(prevBtn, "chevron-left");
    this.monthDisplayEl = leftGroup.createSpan({
      text: this.calendarDate.format("MMM"),
      cls: "diary-heatmap-month-text"
    });
    this.yearDisplayEl = leftGroup.createSpan({
      text: this.viewMode === "heatmap" ? `${this.currentYear}` : this.calendarDate.format("YYYY"),
      cls: "diary-heatmap-year-text"
    });
    const nextBtn = leftGroup.createEl("button", {
      cls: "diary-heatmap-nav-btn"
    });
    (0, import_obsidian7.setIcon)(nextBtn, "chevron-right");
    this.todayBtn = leftGroup.createEl("button", {
      cls: "diary-heatmap-nav-btn diary-heatmap-today-btn"
    });
    (0, import_obsidian7.setIcon)(this.todayBtn, "map-pin");
    prevBtn.addEventListener("click", () => {
      if (this.viewMode === "heatmap") {
        this.currentYear--;
      } else {
        this.calendarDate.subtract(1, "month");
      }
      this.debouncedRefresh();
    });
    nextBtn.addEventListener("click", () => {
      if (this.viewMode === "heatmap") {
        this.currentYear++;
      } else {
        this.calendarDate.add(1, "month");
      }
      this.debouncedRefresh();
    });
    this.todayBtn.addEventListener("click", () => {
      if (this.todayBtn.hasClass("is-disabled")) return;
      this.calendarDate = window.moment();
      this.currentYear = window.moment().year();
      this.debouncedRefresh();
    });
    const tabContainer = titleRow.createDiv("diary-heatmap-tabs");
    this.calendarTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "calendar" ? "active" : ""}`
    });
    (0, import_obsidian7.setIcon)(this.calendarTab, "calendar");
    this.heatmapTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "heatmap" ? "active" : ""}`
    });
    (0, import_obsidian7.setIcon)(this.heatmapTab, "layout-grid");
    this.calendarTab.addEventListener("click", () => {
      if (this.viewMode !== "calendar") {
        this.viewMode = "calendar";
        this.debouncedRefresh();
      }
    });
    this.heatmapTab.addEventListener("click", () => {
      if (this.viewMode !== "heatmap") {
        this.viewMode = "heatmap";
        this.debouncedRefresh();
      }
    });
  }
  async loadData() {
    const config = await this.getConfig();
    if (this.viewMode === "calendar") {
      this.data = await getMonthHeatmapData(
        this.cache,
        config,
        this.calendarDate.year(),
        this.calendarDate.month(),
        this.plugin.settings.weekStart
      );
    } else {
      if (this.currentYear === window.moment().year() && this.plugin.settings.defaultYear === "recent") {
        this.data = await getRecentYearHeatmapData(this.cache, config, this.plugin.settings.weekStart);
      } else {
        this.data = await getYearHeatmapData(
          this.cache,
          config,
          this.currentYear,
          this.plugin.settings.weekStart
        );
      }
    }
  }
  renderContent() {
    if (this.viewMode === "heatmap") {
      this.heatmapRenderer.render(
        this.contentArea,
        this.footerArea,
        this.data,
        this.currentYear,
        this.plugin.settings.thresholds,
        this.plugin.settings.colors,
        this.plugin.settings.darkColors,
        this.plugin.settings.weeklyFolder,
        this.containerElRef.clientWidth - 16
      );
    } else {
      this.calendarRenderer.render(
        this.contentArea,
        this.data,
        this.calendarDate,
        this.plugin.settings.showWeekNumbers,
        this.weeklyExistsInMonth,
        this.weeklyWordCounts,
        this.plugin.settings.thresholds,
        this.plugin.settings.weekStart
      );
    }
  }
  /**
   * 仅重绘热力图布局（不重新加载数据），用于 ResizeObserver 实时响应
   */
  renderHeatmapLayout() {
    this.heatmapRenderer.render(
      this.contentArea,
      this.footerArea,
      this.data,
      this.currentYear,
      this.plugin.settings.thresholds,
      this.plugin.settings.colors,
      this.plugin.settings.darkColors,
      this.plugin.settings.weeklyFolder,
      this.containerElRef.clientWidth - 16
    );
  }
  highlightActiveDiary() {
    const activeFile = this.app.workspace.getActiveFile();
    const prevCell = this.contentArea.querySelector(".diary-heatmap-calendar-cell.is-active");
    if (prevCell) prevCell.classList.remove("is-active");
    const prevWeek = this.contentArea.querySelector(
      ".diary-heatmap-calendar-week-label.is-active-week"
    );
    if (prevWeek) prevWeek.classList.remove("is-active-week");
    if (!activeFile) return;
    const cell = this.contentArea.querySelector(
      `.diary-heatmap-calendar-cell[data-file-path="${activeFile.path}"]`
    );
    if (cell) {
      cell.classList.add("is-active");
      return;
    }
    const weeklyMatch = activeFile.name.match(/^(\d{4})-第(\d{1,2})周\.md$/);
    if (weeklyMatch) {
      const week = parseInt(weeklyMatch[2]);
      const weekLabel = this.contentArea.querySelector(
        `.diary-heatmap-calendar-week-label[data-week-num="${week}"]`
      );
      if (weekLabel) {
        weekLabel.classList.add("is-active-week");
      }
    }
  }
};

// src/main.ts
var DiaryHeatmapPlugin = class extends import_obsidian8.Plugin {
  async onload() {
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
      name: "\u6253\u5F00 Calendar Pro",
      callback: () => {
        this.activateHeatmapView();
      }
    });
    this.addCommand({
      id: "close-diary-heatmap",
      name: "\u5173\u95ED Calendar Pro",
      callback: () => {
        this.closeHeatmapView();
      }
    });
    this.addCommand({
      id: "jump-to-today",
      name: "\u8DF3\u8F6C\u5230\u4ECA\u5929",
      callback: () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
        if (leaves.length > 0) {
          const view = leaves[0].view;
          view.jumpToToday();
        } else {
          this.activateHeatmapView().then(() => {
            const newLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
            if (newLeaves.length > 0) {
              const view = newLeaves[0].view;
              view.jumpToToday();
            }
          });
        }
      }
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
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
    console.log("[Calendar Pro] Plugin unloaded");
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    this.settings.thresholds = this.validateThresholds(this.settings.thresholds);
    this.settings.colors = this.validateColors(this.settings.colors);
    this.settings.darkColors = this.validateColors(this.settings.darkColors);
  }
  validateThresholds(thresholds) {
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
  validateColors(colors) {
    if (!Array.isArray(colors) || colors.length !== 6) {
      return [...DEFAULT_SETTINGS.colors];
    }
    return colors.map(
      (c) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : "#999999"
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  initLeaf() {
    const { workspace } = this.app;
    if (workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP).length > 0) {
      return;
    }
    workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_DIARY_HEATMAP
    });
  }
  async activateHeatmapView() {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
    if (leaves.length > 0) {
      workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = workspace.getRightLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_DIARY_HEATMAP,
      active: true
    });
    workspace.revealLeaf(leaf);
  }
  closeHeatmapView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DIARY_HEATMAP);
  }
  async getEffectiveConfig() {
    if (this.settings.useCustomConfig) {
      return {
        folder: this.settings.customFolder,
        format: this.settings.customFormat,
        template: ""
      };
    }
    return await getDailyNotesConfig(this.app);
  }
};
