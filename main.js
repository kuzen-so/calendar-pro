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
var import_obsidian5 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  thresholds: [100, 300, 600, 1e3],
  defaultYear: "current",
  customFolder: "",
  customFormat: "YYYY-MM-DD",
  useCustomConfig: false
};
var HeatmapSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "\u65E5\u8BB0\u70ED\u529B\u56FE\u8BBE\u7F6E" });
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
    containerEl.createEl("h3", { text: "\u70ED\u529B\u56FE\u5B57\u6570\u9608\u503C" });
    containerEl.createEl("p", {
      text: "\u8BBE\u7F6E\u6BCF\u4E2A\u989C\u8272\u7B49\u7EA7\u5BF9\u5E94\u7684\u5B57\u6570\u4E0A\u9650",
      cls: "setting-item-description"
    });
    const levels = ["\u6D45", "\u4E2D", "\u6DF1", "\u6700\u6DF1"];
    this.plugin.settings.thresholds.forEach((threshold, index) => {
      new import_obsidian.Setting(containerEl).setName(`\u7B49\u7EA7 ${index + 1} (${levels[index]})`).setDesc(`\u5B57\u6570 \u2264 ${threshold} \u65F6\u663E\u793A\u6B64\u989C\u8272`).addSlider(
        (slider) => slider.setLimits(10, 5e3, 10).setValue(threshold).setDynamicTooltip().onChange(async (value) => {
          this.plugin.settings.thresholds[index] = value;
          await this.plugin.saveSettings();
        })
      );
    });
  }
};

// src/ui/heatmap-view.ts
var import_obsidian4 = require("obsidian");

// src/utils/heatmap-data.ts
var import_obsidian3 = require("obsidian");

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

// src/utils/heatmap-data.ts
function countWords(content) {
  const withoutFrontmatter = content.replace(/^---\s*[\s\S]*?---\s*/, "");
  const cleanText = withoutFrontmatter.replace(/[#*\-\[\]\(\)!|`>_]/g, "").replace(/\s+/g, " ").trim();
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
    if (!(file instanceof import_obsidian3.TFile)) {
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
   */
  async getRangeData(config, start, end, yearFilter) {
    const result = [];
    const current = start.clone();
    while (current.isSameOrBefore(end, "day")) {
      const dateStr = current.format("YYYY-MM-DD");
      const inYear = yearFilter !== void 0 ? current.year() === yearFilter : true;
      if (inYear) {
        const { wordCount, exists, filePath } = await this.getDayData(current, config);
        result.push({ date: dateStr, wordCount, exists, filePath, inYear });
      } else {
        const filePath = getDiaryFilePath(current, config);
        result.push({ date: dateStr, wordCount: 0, exists: false, filePath, inYear: false });
      }
      current.add(1, "day");
    }
    return result;
  }
};
async function getYearHeatmapData(cache, config, year) {
  const startOfYear = window.moment(`${year}-01-01`, "YYYY-MM-DD");
  const endOfYear = window.moment(`${year}-12-31`, "YYYY-MM-DD");
  const start = startOfYear.clone().startOf("week");
  const end = endOfYear.clone().endOf("week");
  return cache.getRangeData(config, start, end, year);
}
async function getRecentYearHeatmapData(cache, config) {
  const endDate = window.moment();
  const startDate = endDate.clone().subtract(1, "year").add(1, "day");
  const start = startDate.clone().startOf("week");
  const end = endDate.clone().endOf("week");
  return cache.getRangeData(config, start, end);
}
async function getMonthHeatmapData(cache, config, year, month) {
  const startOfMonth = window.moment([year, month]);
  const endOfMonth = startOfMonth.clone().endOf("month");
  const start = startOfMonth.clone().startOf("week");
  const end = endOfMonth.clone().endOf("week").add(1, "week");
  return cache.getRangeData(config, start, end);
}

// src/ui/heatmap-view.ts
var VIEW_TYPE_DIARY_HEATMAP = "diary-heatmap-view";
var HeatmapView = class extends import_obsidian4.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.data = [];
    this.refreshTimer = null;
    this.isLoading = false;
    this.resizeObserver = null;
    this.plugin = plugin;
    this.currentYear = window.moment().year();
    this.calendarDate = window.moment();
    this.viewMode = "calendar";
    this.cache = new DataCache(this.app);
  }
  getViewType() {
    return VIEW_TYPE_DIARY_HEATMAP;
  }
  getDisplayText() {
    return "\u65E5\u8BB0\u70ED\u529B\u56FE";
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
    this.loadingEl.hide();
    this.renderContent();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.viewMode === "heatmap") {
        requestAnimationFrame(() => this.renderHeatmapLayout());
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
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
  }
  async onClose() {
    this.clearDebouncedRefresh();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
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
    if (this.monthDisplayEl) {
      this.monthDisplayEl.setText(
        this.viewMode === "calendar" ? this.calendarDate.format("MMM") : ""
      );
    }
    if (this.yearDisplayEl) {
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
    this.contentArea.empty();
    this.footerArea.empty();
    await this.loadData();
    this.loadingEl.hide();
    this.isLoading = false;
    this.renderContent();
  }
  getSettings() {
    return this.plugin.settings;
  }
  async getConfig() {
    return await this.plugin.getEffectiveConfig();
  }
  renderHeader() {
    const header = this.containerElRef.createDiv("diary-heatmap-header");
    const titleRow = header.createDiv("diary-heatmap-title-row");
    const leftGroup = titleRow.createDiv("diary-heatmap-title-group");
    const prevBtn = leftGroup.createEl("button", {
      text: "\u25C0",
      cls: "diary-heatmap-nav-btn"
    });
    this.monthDisplayEl = leftGroup.createSpan({
      text: this.viewMode === "calendar" ? this.calendarDate.format("MMM") : "",
      cls: "diary-heatmap-month-text"
    });
    this.yearDisplayEl = leftGroup.createSpan({
      text: this.viewMode === "heatmap" ? `${this.currentYear}` : this.calendarDate.format("YYYY"),
      cls: "diary-heatmap-year-text"
    });
    const nextBtn = leftGroup.createEl("button", {
      text: "\u25B6",
      cls: "diary-heatmap-nav-btn"
    });
    const todayBtn = leftGroup.createEl("button", {
      text: "Today",
      cls: "diary-heatmap-nav-btn diary-heatmap-today-btn"
    });
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
    todayBtn.addEventListener("click", () => {
      this.calendarDate = window.moment();
      this.currentYear = window.moment().year();
      this.debouncedRefresh();
    });
    const tabContainer = titleRow.createDiv("diary-heatmap-tabs");
    this.calendarTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "calendar" ? "active" : ""}`,
      text: "\u{1F4C5}"
    });
    this.heatmapTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "heatmap" ? "active" : ""}`,
      text: "\u{1F525}"
    });
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
        this.calendarDate.month()
      );
    } else {
      if (this.currentYear === window.moment().year() && this.plugin.settings.defaultYear === "recent") {
        this.data = await getRecentYearHeatmapData(this.cache, config);
      } else {
        this.data = await getYearHeatmapData(
          this.cache,
          config,
          this.currentYear
        );
      }
    }
  }
  renderContent() {
    if (this.viewMode === "heatmap") {
      this.renderHeatmap();
    } else {
      this.renderCalendar();
    }
  }
  /**
   * 仅重绘热力图布局（不重新加载数据），用于 ResizeObserver 实时响应
   */
  renderHeatmapLayout() {
    this.contentArea.empty();
    this.footerArea.empty();
    this.renderHeatmap();
  }
  renderHeatmap() {
    const wrapper = this.contentArea.createDiv("diary-heatmap-grid-wrapper");
    const now = window.moment();
    const endOfYear = window.moment(`${this.currentYear}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
    const remainingMonths = Math.max(0, endOfYear.diff(now, "months"));
    const remainingDays = Math.max(0, endOfYear.diff(now, "days"));
    const remainingHours = Math.max(0, endOfYear.diff(now, "hours"));
    const topStats = wrapper.createDiv("diary-heatmap-top-stats");
    topStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: `\u672C\u5E74\u5EA6\u5269\u4F59 ${remainingMonths} \u6708 \xB7 ${remainingDays} \u5929 \xB7 ${remainingHours} \u5C0F\u65F6`
    });
    const grid = wrapper.createDiv("diary-heatmap-grid");
    const containerWidth = this.containerElRef.clientWidth - 16;
    const cellTotal = 14;
    const maxCols = Math.max(1, Math.floor(containerWidth / cellTotal));
    const totalCells = this.data.length;
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
    this.data.forEach((day, index) => {
      if (day.date) {
        const month = window.moment(day.date).month();
        if (!monthFirstIndices.has(month)) {
          monthFirstIndices.set(month, index);
        }
      }
    });
    const fragment = document.createDocumentFragment();
    this.data.forEach((day, index) => {
      const cell = document.createElement("div");
      cell.className = "diary-heatmap-cell";
      const level = getHeatLevel(day.wordCount, this.getSettings().thresholds);
      cell.classList.add(`level-${level}`);
      cell.setAttribute("data-date", day.date);
      cell.setAttribute("data-count", String(day.wordCount));
      if (day.date) {
        const month = window.moment(day.date).month();
        if (monthFirstIndices.get(month) === index) {
          const monthBadge = document.createElement("span");
          monthBadge.className = "diary-heatmap-month-badge";
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
          this.openDiary(day.filePath);
        });
      } else if (day.date) {
        cell.classList.add("no-diary");
        cell.addEventListener("click", () => {
          this.createDiary(day.date);
        });
      } else {
        cell.classList.add("empty-cell");
      }
      fragment.appendChild(cell);
    });
    const totalGridCells = cols * rows;
    for (let i = this.data.length; i < totalGridCells; i++) {
      const cell = document.createElement("div");
      cell.className = "diary-heatmap-cell empty-cell";
      fragment.appendChild(cell);
    }
    grid.appendChild(fragment);
    const yearStats = this.data.reduce(
      (acc, d) => {
        if (d.exists && d.date && window.moment(d.date).year() === this.currentYear) {
          acc.diaryCount++;
          acc.totalWords += d.wordCount;
        }
        return acc;
      },
      { diaryCount: 0, totalWords: 0 }
    );
    const bottomStats = wrapper.createDiv("diary-heatmap-bottom-stats");
    bottomStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: `\u672C\u5E74\u5EA6\u5171\u5199 ${yearStats.diaryCount} \u7BC7\u65E5\u8BB0 \xB7 \u5171\u8BA1 ${yearStats.totalWords} \u5B57`
    });
  }
  renderFooter() {
    const footer = this.footerArea.createDiv("diary-heatmap-footer");
    const legend = footer.createDiv("diary-heatmap-legend");
    for (let i = 0; i <= 4; i++) {
      const box = legend.createDiv("diary-heatmap-legend-box");
      box.classList.add(`level-${i}`);
    }
  }
  renderStatsBar() {
    const statsBar = this.footerArea.createDiv("diary-heatmap-stats-bar");
    const totalDays = this.data.filter((d) => d.exists).length;
    const totalWords = this.data.reduce((sum, d) => sum + d.wordCount, 0);
    statsBar.createSpan({
      cls: "diary-heatmap-stat",
      text: `\u{1F4C5} ${totalDays}\u5929  \u{1F4DD} ${totalWords}\u5B57`
    });
  }
  renderCalendar() {
    const wrapper = this.contentArea.createDiv(
      "diary-heatmap-calendar-wrapper"
    );
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const headerRow = wrapper.createDiv("diary-heatmap-calendar-header");
    headerRow.createDiv("diary-heatmap-calendar-header-spacer");
    weekDays.forEach((d) => {
      headerRow.createDiv("diary-heatmap-calendar-weekday").setText(d);
    });
    const gridArea = wrapper.createDiv("diary-heatmap-calendar-grid-area");
    const weeks = this.groupByWeeks(this.data);
    const fragment = document.createDocumentFragment();
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find((d) => d.date);
      let weekNum = 0;
      if (firstDayOfWeek) {
        weekNum = window.moment(firstDayOfWeek.date).week();
      }
      const weekLabelEl = document.createElement("div");
      weekLabelEl.className = "diary-heatmap-calendar-week-label week-number";
      weekLabelEl.textContent = String(weekNum);
      weekLabelEl.addEventListener("click", () => {
        this.openOrCreateWeeklyDiary(this.calendarDate.year(), weekNum);
      });
      fragment.appendChild(weekLabelEl);
      week.forEach((dayData) => {
        const cell = document.createElement("div");
        cell.className = "diary-heatmap-calendar-cell";
        if (!dayData.date) {
          cell.classList.add("empty");
          fragment.appendChild(cell);
          return;
        }
        const date = window.moment(dayData.date);
        const isCurrentMonth = date.month() === this.calendarDate.month() && date.year() === this.calendarDate.year();
        const isToday = date.isSame(window.moment(), "day");
        const dayNum = document.createElement("span");
        dayNum.className = "day-number";
        dayNum.textContent = date.format("D");
        cell.appendChild(dayNum);
        if (dayData.exists) {
          const level = getHeatLevel(
            dayData.wordCount,
            this.getSettings().thresholds
          );
          cell.classList.add(`level-${level}`, "has-diary");
          cell.setAttribute("data-tip", `${date.format("MMM D, dddd")}: ${dayData.wordCount}\u5B57`);
          cell.setAttribute("data-file-path", dayData.filePath);
          const dot = document.createElement("span");
          dot.className = "diary-dot";
          cell.appendChild(dot);
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
            this.openDiary(dayData.filePath);
          } else {
            this.createDiary(dayData.date);
          }
        });
        if (dayData.exists) {
          cell.addEventListener("contextmenu", (evt) => {
            evt.preventDefault();
            this.showCalendarContextMenu(evt, dayData);
          });
        }
        fragment.appendChild(cell);
      });
    });
    gridArea.appendChild(fragment);
    const stats = this.data.reduce(
      (acc, d) => {
        if (!d.date) return acc;
        const date = window.moment(d.date);
        if (date.month() === this.calendarDate.month() && date.year() === this.calendarDate.year()) {
          acc.totalWords += d.wordCount;
          if (d.exists) acc.diaryDays++;
        }
        return acc;
      },
      { diaryDays: 0, totalWords: 0 }
    );
    const calendarFooter = wrapper.createDiv("diary-heatmap-calendar-footer");
    calendarFooter.createSpan({
      cls: "diary-heatmap-calendar-footer-text",
      text: `\u672C\u6708\u65E5\u8BB0 ${stats.diaryDays} \u7BC7 \xB7 \u5171\u8BA1 ${stats.totalWords} \u5B57`
    });
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
    return weeks;
  }
  getMonthLabels() {
    const months = [];
    let currentMonth = -1;
    this.data.forEach((day, index) => {
      if (day.date) {
        const month = window.moment(day.date).month();
        if (month !== currentMonth && index % 7 === 0) {
          months.push({
            label: window.moment(day.date).format("M\u6708"),
            col: Math.floor(index / 7) + 1
          });
          currentMonth = month;
        }
      }
    });
    return months;
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
        this.debouncedRefresh();
        new import_obsidian4.Notice("\u65E5\u8BB0\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9");
      })
    );
    menu.showAtMouseEvent(evt);
  }
  highlightActiveDiary() {
    const activeFile = this.app.workspace.getActiveFile();
    this.contentArea.querySelectorAll(".diary-heatmap-calendar-cell.is-active").forEach((el) => {
      el.classList.remove("is-active");
    });
    if (!activeFile) return;
    const cell = this.contentArea.querySelector(
      `.diary-heatmap-calendar-cell[data-file-path="${activeFile.path}"]`
    );
    if (cell) {
      cell.classList.add("is-active");
    }
  }
  openDiary(filePath) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian4.TFile) {
      this.app.workspace.getLeaf().openFile(file);
    }
  }
  async createDiary(dateStr) {
    const config = await this.getConfig();
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
          content = content.replace(/\{\{date\}\}/g, formattedDate).replace(/\{\{title\}\}/g, formattedDate).replace(/\{\{time\}\}/g, date.format("HH:mm"));
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
    const config = await this.getConfig();
    const folder = getFolderPath(config);
    const fileName = `${year}-W${String(week).padStart(2, "0")}.md`;
    const filePath = folder ? (0, import_obsidian4.normalizePath)(`${folder}/${fileName}`) : fileName;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian4.TFile) {
      this.app.workspace.getLeaf().openFile(file);
      return;
    }
    try {
      const content = `# ${year}\u5E74\u7B2C${week}\u5468

`;
      if (folder && !await this.app.vault.adapter.exists(folder)) {
        await this.app.vault.createFolder(folder);
      }
      const newFile = await this.app.vault.create(filePath, content);
      this.app.workspace.getLeaf().openFile(newFile);
    } catch (e) {
      console.error(`[Diary Heatmap] Failed to create weekly note:`, e);
      new import_obsidian4.Notice("\u521B\u5EFA\u5468\u8BB0\u5931\u8D25");
    }
  }
};
var ConfirmModal = class extends import_obsidian4.Modal {
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
    new import_obsidian4.ButtonComponent(buttonContainer).setButtonText("\u53D6\u6D88").onClick(() => {
      this.close();
    });
    new import_obsidian4.ButtonComponent(buttonContainer).setButtonText("\u521B\u5EFA").setCta().onClick(() => {
      this.onConfirm();
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/main.ts
var DiaryHeatmapPlugin = class extends import_obsidian5.Plugin {
  async onload() {
    await this.loadSettings();
    console.log("[Diary Heatmap] Plugin loaded v1.2.0");
    this.registerView(
      VIEW_TYPE_DIARY_HEATMAP,
      (leaf) => new HeatmapView(leaf, this)
    );
    this.addRibbonIcon("calendar", "\u65E5\u8BB0\u70ED\u529B\u56FE", () => {
      this.activateHeatmapView();
    });
    this.addCommand({
      id: "open-diary-heatmap",
      name: "\u6253\u5F00\u65E5\u8BB0\u70ED\u529B\u56FE",
      callback: () => {
        this.activateHeatmapView();
      }
    });
    this.addCommand({
      id: "close-diary-heatmap",
      name: "\u5173\u95ED\u65E5\u8BB0\u70ED\u529B\u56FE",
      callback: () => {
        this.closeHeatmapView();
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
    console.log("[Diary Heatmap] Plugin unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
