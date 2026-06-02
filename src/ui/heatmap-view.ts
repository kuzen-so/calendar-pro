import {
  ItemView,
  WorkspaceLeaf,
  TFile,
  Notice,
  normalizePath,
  Modal,
  ButtonComponent,
  Menu,
} from "obsidian";
import DiaryHeatmapPlugin from "../main";
import {
  HeatmapDayData,
  DataCache,
  getHeatLevel,
  getYearHeatmapData,
  getRecentYearHeatmapData,
  getMonthHeatmapData,
} from "../utils/heatmap-data";
import {
  DailyNotesConfig,
  getFolderPath,
  getDiaryFilePath,
  readTemplateContent,
} from "../utils/daily-notes-config";

export const VIEW_TYPE_DIARY_HEATMAP = "diary-heatmap-view";

type ViewMode = "heatmap" | "calendar";

export class HeatmapView extends ItemView {
  private plugin: DiaryHeatmapPlugin;
  private data: HeatmapDayData[] = [];
  private currentYear: number;
  private calendarDate: moment.Moment;
  private viewMode: ViewMode;

  private containerElRef: HTMLElement;
  private loadingEl: HTMLElement;
  private monthDisplayEl: HTMLElement;
  private yearDisplayEl: HTMLElement;
  private heatmapTab: HTMLElement;
  private calendarTab: HTMLElement;
  private contentArea: HTMLElement;
  private footerArea: HTMLElement;

  private refreshTimer: number | null = null;
  private isLoading = false;
  private cache: DataCache;
  private resizeObserver: ResizeObserver | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: DiaryHeatmapPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentYear = window.moment().year();
    this.calendarDate = window.moment();
    this.viewMode = "calendar";
    this.cache = new DataCache(this.app);
  }

  getViewType(): string {
    return VIEW_TYPE_DIARY_HEATMAP;
  }

  getDisplayText(): string {
    return "日记热力图";
  }

  getIcon(): string {
    return "calendar";
  }

  async onOpen(): Promise<void> {
    this.containerElRef = this.contentEl.createDiv("diary-heatmap-container");
    this.renderHeader();
    this.loadingEl = this.containerElRef.createDiv("diary-heatmap-loading");
    this.loadingEl.setText("加载中...");
    this.contentArea = this.containerElRef.createDiv();
    this.footerArea = this.containerElRef.createDiv();

    await this.loadData();
    this.loadingEl.hide();
    this.renderContent();

    // 监听容器宽度变化，热力图实时重排（边拖动边改变）
    this.resizeObserver = new ResizeObserver(() => {
      if (this.viewMode === "heatmap") {
        requestAnimationFrame(() => this.renderHeatmapLayout());
      }
    });
    this.resizeObserver.observe(this.containerElRef);

    // 监听当前打开文件变化，高亮正在查看的日记
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.highlightActiveDiary();
      })
    );
    this.highlightActiveDiary();

    // 监听 vault 文件变化，自动刷新
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.cache.invalidate(file.path);
          this.debouncedRefresh();
        }
      })
    );
  }

  async onClose(): Promise<void> {
    this.clearDebouncedRefresh();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.contentEl.empty();
  }

  private debouncedRefresh(): void {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = window.setTimeout(() => {
      this.refresh();
    }, 300);
  }

  private clearDebouncedRefresh(): void {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async refresh(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    this.loadingEl.show();

    // 更新标题
    if (this.monthDisplayEl) {
      this.monthDisplayEl.setText(
        this.viewMode === "calendar" ? this.calendarDate.format("MMM") : ""
      );
    }
    if (this.yearDisplayEl) {
      this.yearDisplayEl.setText(
        this.viewMode === "heatmap"
          ? `${this.currentYear}`
          : this.calendarDate.format("YYYY")
      );
    }
    if (this.heatmapTab) {
      this.heatmapTab.classList.toggle("active", this.viewMode === "heatmap");
    }
    if (this.calendarTab) {
      this.calendarTab.classList.toggle("active", this.viewMode === "calendar");
    }

    // 清空内容区
    this.contentArea.empty();
    this.footerArea.empty();

    await this.loadData();
    this.loadingEl.hide();
    this.isLoading = false;
    this.renderContent();
  }

  private getSettings() {
    return this.plugin.settings;
  }

  private async getConfig(): Promise<DailyNotesConfig> {
    return await this.plugin.getEffectiveConfig();
  }

  private renderHeader(): void {
    const header = this.containerElRef.createDiv("diary-heatmap-header");

    const titleRow = header.createDiv("diary-heatmap-title-row");

    const leftGroup = titleRow.createDiv("diary-heatmap-title-group");
    const prevBtn = leftGroup.createEl("button", {
      text: "◀",
      cls: "diary-heatmap-nav-btn",
    });

    this.monthDisplayEl = leftGroup.createSpan({
      text: this.viewMode === "calendar" ? this.calendarDate.format("MMM") : "",
      cls: "diary-heatmap-month-text",
    });
    this.yearDisplayEl = leftGroup.createSpan({
      text:
        this.viewMode === "heatmap"
          ? `${this.currentYear}`
          : this.calendarDate.format("YYYY"),
      cls: "diary-heatmap-year-text",
    });

    const nextBtn = leftGroup.createEl("button", {
      text: "▶",
      cls: "diary-heatmap-nav-btn",
    });

    // Today 按钮
    const todayBtn = leftGroup.createEl("button", {
      text: "Today",
      cls: "diary-heatmap-nav-btn diary-heatmap-today-btn",
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

    // 分段控制器切换按钮
    const tabContainer = titleRow.createDiv("diary-heatmap-tabs");
    this.calendarTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "calendar" ? "active" : ""}`,
      text: "📅",
    });
    this.heatmapTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "heatmap" ? "active" : ""}`,
      text: "🔥",
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

  private async loadData(): Promise<void> {
    const config = await this.getConfig();
    if (this.viewMode === "calendar") {
      this.data = await getMonthHeatmapData(
        this.cache,
        config,
        this.calendarDate.year(),
        this.calendarDate.month()
      );
    } else {
      if (
        this.currentYear === window.moment().year() &&
        this.plugin.settings.defaultYear === "recent"
      ) {
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

  private renderContent(): void {
    if (this.viewMode === "heatmap") {
      this.renderHeatmap();
    } else {
      this.renderCalendar();
    }
  }

  /**
   * 仅重绘热力图布局（不重新加载数据），用于 ResizeObserver 实时响应
   */
  private renderHeatmapLayout(): void {
    this.contentArea.empty();
    this.footerArea.empty();
    this.renderHeatmap();
  }

  private renderHeatmap(): void {
    const wrapper = this.contentArea.createDiv("diary-heatmap-grid-wrapper");

    // 上方：本年度剩余时间
    const now = window.moment();
    const endOfYear = window.moment(`${this.currentYear}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
    const remainingMonths = Math.max(0, endOfYear.diff(now, "months"));
    const remainingDays = Math.max(0, endOfYear.diff(now, "days"));
    const remainingHours = Math.max(0, endOfYear.diff(now, "hours"));

    const topStats = wrapper.createDiv("diary-heatmap-top-stats");
    topStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: `本年度剩余 ${remainingMonths} 月 · ${remainingDays} 天 · ${remainingHours} 小时`,
    });

    const grid = wrapper.createDiv("diary-heatmap-grid");

    // 根据容器宽度计算列数
    const containerWidth = this.containerElRef.clientWidth - 16;
    const cellTotal = 14; // 12px(cell) + 2px(gap)
    const maxCols = Math.max(1, Math.floor(containerWidth / cellTotal));
    const totalCells = this.data.length;

    // 行数限制在 1-20
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

    // 找出每个月在网格中的第一个索引
    const monthFirstIndices = new Map<number, number>();
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

      // 月份小标记：每个月的第一个方块左上角显示月份数字
      if (day.date) {
        const month = window.moment(day.date).month();
        if (monthFirstIndices.get(month) === index) {
          const monthBadge = document.createElement("span");
          monthBadge.className = "diary-heatmap-month-badge";
          monthBadge.textContent = String(month + 1);
          cell.appendChild(monthBadge);
        }
      }

      const dateStr = day.date
        ? window.moment(day.date).format("M月D日 dddd")
        : "";
      cell.setAttribute("data-tip", `${dateStr}: ${day.wordCount}字`);

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

    // 补齐最后一行使网格完整
    const totalGridCells = cols * rows;
    for (let i = this.data.length; i < totalGridCells; i++) {
      const cell = document.createElement("div");
      cell.className = "diary-heatmap-cell empty-cell";
      fragment.appendChild(cell);
    }

    grid.appendChild(fragment);

    // 下方：本年度日记统计
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
      text: `本年度共写 ${yearStats.diaryCount} 篇日记 · 共计 ${yearStats.totalWords} 字`,
    });
  }

  private renderFooter(): void {
    const footer = this.footerArea.createDiv("diary-heatmap-footer");
    const legend = footer.createDiv("diary-heatmap-legend");
    for (let i = 0; i <= 4; i++) {
      const box = legend.createDiv("diary-heatmap-legend-box");
      box.classList.add(`level-${i}`);
    }
  }

  private renderStatsBar(): void {
    const statsBar = this.footerArea.createDiv("diary-heatmap-stats-bar");
    const totalDays = this.data.filter((d) => d.exists).length;
    const totalWords = this.data.reduce((sum, d) => sum + d.wordCount, 0);
    statsBar.createSpan({
      cls: "diary-heatmap-stat",
      text: `📅 ${totalDays}天  📝 ${totalWords}字`,
    });
  }

  private renderCalendar(): void {
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
      // 计算周数
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
        const isCurrentMonth =
          date.month() === this.calendarDate.month() &&
          date.year() === this.calendarDate.year();
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
          cell.setAttribute("data-tip", `${date.format("MMM D, dddd")}: ${dayData.wordCount}字`);
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

        // 右键菜单（仅对有日记的日期）
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

    // 本月统计栏
    const stats = this.data.reduce(
      (acc, d) => {
        if (!d.date) return acc;
        const date = window.moment(d.date);
        if (
          date.month() === this.calendarDate.month() &&
          date.year() === this.calendarDate.year()
        ) {
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
      text: `本月日记 ${stats.diaryDays} 篇 · 共计 ${stats.totalWords} 字`,
    });
  }

  private groupByWeeks(data: HeatmapDayData[]): HeatmapDayData[][] {
    const weeks: HeatmapDayData[][] = [];
    let currentWeek: HeatmapDayData[] = [];
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
          filePath: "",
        });
      }
      weeks.push(currentWeek);
    }
    return weeks;
  }

  private getMonthLabels(): { label: string; col: number }[] {
    const months: { label: string; col: number }[] = [];
    let currentMonth = -1;
    this.data.forEach((day, index) => {
      if (day.date) {
        const month = window.moment(day.date).month();
        if (month !== currentMonth && index % 7 === 0) {
          months.push({
            label: window.moment(day.date).format("M月"),
            col: Math.floor(index / 7) + 1,
          });
          currentMonth = month;
        }
      }
    });
    return months;
  }

  private showCalendarContextMenu(
    evt: MouseEvent,
    dayData: HeatmapDayData
  ): void {
    const file = this.app.vault.getAbstractFileByPath(dayData.filePath);
    if (!(file instanceof TFile)) return;

    const menu = new Menu();

    menu.addItem((item) =>
      item
        .setTitle("打开日记")
        .setIcon("file-text")
        .onClick(() => this.openDiary(dayData.filePath))
    );

    menu.addItem((item) =>
      item
        .setTitle("复制路径")
        .setIcon("copy")
        .onClick(() => {
          navigator.clipboard.writeText(dayData.filePath);
          new Notice("路径已复制到剪贴板");
        })
    );

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle("删除日记")
        .setIcon("trash")
        .onClick(async () => {
          await this.app.fileManager.trashFile(file);
          this.cache.invalidate(dayData.filePath);
          this.debouncedRefresh();
          new Notice("日记已移至回收站");
        })
    );

    menu.showAtMouseEvent(evt);
  }

  private highlightActiveDiary(): void {
    const activeFile = this.app.workspace.getActiveFile();

    // 移除之前的高亮
    this.contentArea.querySelectorAll(".diary-heatmap-calendar-cell.is-active").forEach((el) => {
      el.classList.remove("is-active");
    });

    if (!activeFile) return;

    // 查找当前打开文件对应的日历格子
    const cell = this.contentArea.querySelector(
      `.diary-heatmap-calendar-cell[data-file-path="${activeFile.path}"]`
    );
    if (cell) {
      cell.classList.add("is-active");
    }
  }

  private openDiary(filePath: string): void {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
    }
  }

  private async createDiary(dateStr: string): Promise<void> {
    const config = await this.getConfig();
    const date = window.moment(dateStr, "YYYY-MM-DD");
    const filePath = getDiaryFilePath(date, config);

    // 检查文件是否已存在
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof TFile) {
      this.app.workspace.getLeaf().openFile(existing);
      return;
    }

    const formattedDate = date.format("YYYY年M月D日");

    // 二次确认弹窗
    new ConfirmModal(
      this.app,
      `是否创建 ${formattedDate} 的日记？`,
      async () => {
        try {
          // 读取模板
          let content = "";
          if (config.template) {
            content = await readTemplateContent(this.app, config.template);
          }

          // 替换模板中的日期变量
          const dayOfWeek = date.format("dddd");
          content = content
            .replace(/\{\{date\}\}/g, formattedDate)
            .replace(/\{\{title\}\}/g, formattedDate)
            .replace(/\{\{time\}\}/g, date.format("HH:mm"));

          // 如果没有模板内容，创建空白文件
          if (!content.trim()) {
            content = "";
          }

          const folder = getFolderPath(config);
          if (folder && !(await this.app.vault.adapter.exists(folder))) {
            await this.app.vault.createFolder(folder);
          }

          const newFile = await this.app.vault.create(filePath, content);
          this.app.workspace.getLeaf().openFile(newFile);
          new Notice(`已创建日记: ${formattedDate}`);
        } catch (e) {
          console.error(`[Diary Heatmap] Failed to create diary:`, e);
          new Notice("创建日记失败");
        }
      }
    ).open();
  }

  private async openOrCreateWeeklyDiary(
    year: number,
    week: number
  ): Promise<void> {
    const config = await this.getConfig();
    const folder = getFolderPath(config);
    const fileName = `${year}-W${String(week).padStart(2, "0")}.md`;
    const filePath = folder
      ? normalizePath(`${folder}/${fileName}`)
      : fileName;

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
      return;
    }

    try {
      const content = `# ${year}年第${week}周\n\n`;
      if (folder && !(await this.app.vault.adapter.exists(folder))) {
        await this.app.vault.createFolder(folder);
      }
      const newFile = await this.app.vault.create(filePath, content);
      this.app.workspace.getLeaf().openFile(newFile);
    } catch (e) {
      console.error(`[Diary Heatmap] Failed to create weekly note:`, e);
      new Notice("创建周记失败");
    }
  }
}

/**
 * 确认对话框 Modal
 */
class ConfirmModal extends Modal {
  constructor(
    app: import("obsidian").App,
    private message: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });

    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    new ButtonComponent(buttonContainer)
      .setButtonText("取消")
      .onClick(() => {
        this.close();
      });

    new ButtonComponent(buttonContainer)
      .setButtonText("创建")
      .setCta()
      .onClick(() => {
        this.onConfirm();
        this.close();
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
