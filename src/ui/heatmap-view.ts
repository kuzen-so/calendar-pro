import {
  ItemView,
  WorkspaceLeaf,
  TFile,
  Notice,
  normalizePath,
  Modal,
  ButtonComponent,
  Menu,
  setIcon,
} from "obsidian";
import DiaryHeatmapPlugin from "../main";
import {
  HeatmapDayData,
  DataCache,
  getHeatLevel,
  getYearHeatmapData,
  getRecentYearHeatmapData,
  getMonthHeatmapData,
  countWords,
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
  private todayBtn: HTMLElement;
  private contentArea: HTMLElement;
  private footerArea: HTMLElement;

  private refreshTimer: number | null = null;
  private resizeTimer: number | null = null;
  private isLoading = false;
  private cache: DataCache;
  private resizeObserver: ResizeObserver | null = null;
  private weeklyExistsInMonth = new Set<number>();
  private weeklyWordCounts = new Map<number, number>();

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
    return "Calendar Pro";
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

    // 监听容器宽度变化，热力图实时重排（带防抖，避免拖拽时频繁重绘）
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
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
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

    try {
      // 更新标题：日历和热力图统一显示 ◀ 月份 年份 ▶
      if (this.monthDisplayEl) {
        this.monthDisplayEl.style.display = "";
        this.monthDisplayEl.setText(this.calendarDate.format("MMM"));
      }
      if (this.yearDisplayEl) {
        this.yearDisplayEl.style.display = "";
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
      this.updateTodayButtonState();

      // 清空内容区
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
  private async loadWeeklyExists(): Promise<void> {
    this.weeklyExistsInMonth.clear();
    this.weeklyWordCounts.clear();
    const config = await this.getConfig();
    const weeklyFolder = this.plugin.settings.weeklyFolder
      ? normalizePath(this.plugin.settings.weeklyFolder)
      : "";
    const diaryFolder = getFolderPath(config);
    const folder = weeklyFolder || diaryFolder;
    const processedWeeks = new Set<number>();
    const readPromises: Promise<void>[] = [];

    this.data.forEach((d) => {
      if (!d.date) return;
      const date = window.moment(d.date);
      const weekNum = date.week();
      if (processedWeeks.has(weekNum)) return;
      processedWeeks.add(weekNum);

      const fileName = `${this.calendarDate.year()}-第${weekNum}周.md`;
      const filePath = folder
        ? normalizePath(`${folder}/${fileName}`)
        : fileName;
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file instanceof TFile) {
        this.weeklyExistsInMonth.add(weekNum);
        readPromises.push(
          this.app.vault.read(file).then((content) => {
            this.weeklyWordCounts.set(weekNum, countWords(content));
          }).catch(() => {
            // 忽略读取失败，避免阻塞刷新
          })
        );
      }
    });

    await Promise.all(readPromises);
  }

  /**
   * 更新 Today 按钮状态：若当前已显示今天，则禁用
   */
  private updateTodayButtonState(): void {
    if (!this.todayBtn) return;
    const now = window.moment();
    let isToday = false;
    if (this.viewMode === "calendar") {
      isToday =
        this.calendarDate.year() === now.year() &&
        this.calendarDate.month() === now.month();
    } else {
      isToday = this.currentYear === now.year();
    }
    this.todayBtn.toggleClass("is-disabled", isToday);
    this.todayBtn.disabled = isToday;
  }

  private getSettings() {
    return this.plugin.settings;
  }

  private async getConfig(): Promise<DailyNotesConfig> {
    return await this.plugin.getEffectiveConfig();
  }

  /**
   * 公共方法：跳转到今天（供命令面板调用）
   */
  jumpToToday(): void {
    this.calendarDate = window.moment();
    this.currentYear = window.moment().year();
    this.debouncedRefresh();
  }

  private renderHeader(): void {
    const header = this.containerElRef.createDiv("diary-heatmap-header");

    const titleRow = header.createDiv("diary-heatmap-title-row");

    const leftGroup = titleRow.createDiv("diary-heatmap-title-group");
    const prevBtn = leftGroup.createEl("button", {
      cls: "diary-heatmap-nav-btn",
    });
    setIcon(prevBtn, "chevron-left");

    this.monthDisplayEl = leftGroup.createSpan({
      text: this.calendarDate.format("MMM"),
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
      cls: "diary-heatmap-nav-btn",
    });
    setIcon(nextBtn, "chevron-right");

    // Today 按钮（用图标替代文字，更简洁通用）
    this.todayBtn = leftGroup.createEl("button", {
      cls: "diary-heatmap-nav-btn diary-heatmap-today-btn",
    });
    setIcon(this.todayBtn, "map-pin");

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
        this.calendarDate.month(),
        this.plugin.settings.weekStart
      );
    } else {
      if (
        this.currentYear === window.moment().year() &&
        this.plugin.settings.defaultYear === "recent"
      ) {
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

    // 上方：根据年份动态显示时间提示
    const now = window.moment();
    let topStatsText = "";
    if (this.currentYear === now.year()) {
      const endOfYear = window.moment(`${this.currentYear}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
      const remainingMonths = Math.max(0, endOfYear.diff(now, "months"));
      const remainingDays = Math.max(0, endOfYear.diff(now, "days"));
      const remainingHours = Math.max(0, endOfYear.diff(now, "hours"));
      topStatsText = `本年度剩余 ${remainingMonths} 月 · ${remainingDays} 天 · ${remainingHours} 小时`;
    } else if (this.currentYear < now.year()) {
      const endOfYear = window.moment(`${this.currentYear}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
      const passedDays = Math.max(0, now.diff(endOfYear, "days"));
      topStatsText = `距离 ${this.currentYear} 年已过去 ${passedDays} 天`;
    } else {
      const startOfYear = window.moment(`${this.currentYear}-01-01 00:00:00`, "YYYY-MM-DD HH:mm:ss");
      const remainingDays = Math.max(0, startOfYear.diff(now, "days"));
      topStatsText = `距离 ${this.currentYear} 年还有 ${remainingDays} 天`;
    }

    const topStats = wrapper.createDiv("diary-heatmap-top-stats");
    topStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: topStatsText,
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
    const isCurrentYear = this.currentYear === now.year();
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
          if (!isCurrentYear || month !== now.month()) {
            monthBadge.classList.add("dimmed");
          }
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

    // 下方：本年度日记与周记统计
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

    const weeklyPattern = new RegExp(`^${this.currentYear}-第\\d{1,2}周\\.md$`);
    const weeklyCount = this.app.vault.getFiles().filter((f) =>
      weeklyPattern.test(f.name)
    ).length;

    const bottomStats = wrapper.createDiv("diary-heatmap-bottom-stats");
    bottomStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: `本年度共写 ${yearStats.diaryCount} 篇日记 • ${weeklyCount} 篇周记 • 共计 ${yearStats.totalWords} 字`,
    });
  }

  private renderCalendar(): void {
    const wrapper = this.contentArea.createDiv(
      "diary-heatmap-calendar-wrapper"
    );
    const showWeekNumbers = this.plugin.settings.showWeekNumbers;
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    const weeks = this.groupByWeeks(this.data);

    const fragment = document.createDocumentFragment();

    weeks.forEach((week, weekIndex) => {
      // 计算周数
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
            this.openOrCreateWeeklyDiary(this.calendarDate.year(), weekNum);
          });
          weekLabelEl.addEventListener("contextmenu", (evt) => {
            evt.preventDefault();
            this.showWeeklyContextMenu(evt, this.calendarDate.year(), weekNum);
          });
          if (this.weeklyExistsInMonth.has(weekNum)) {
            const wordCount = this.weeklyWordCounts.get(weekNum) || 0;
            const dots = this.getWeeklyDots(wordCount);
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
          const dots = this.getWeeklyDots(dayData.wordCount);
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

  /**
   * 根据周记字数计算圆点状态
   * 阈值：50、150、300、500
   * 达到阈值显示实心，下一级显示虚线
   */
  private getWeeklyDots(wordCount: number): boolean[] {
    const thresholds = [50, 150, 300, 500];
    const dots: boolean[] = [];
    for (const t of thresholds) {
      if (wordCount >= t) {
        dots.push(true); // 实心
      } else {
        dots.push(false); // 虚线
        break;
      }
    }
    return dots;
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

    // 固定为 6 周，不足的补空行，避免切换月份时高度变化导致滚动条抖动
    const MIN_WEEKS = 6;
    while (weeks.length < MIN_WEEKS) {
      const emptyWeek: HeatmapDayData[] = [];
      for (let i = 0; i < 7; i++) {
        emptyWeek.push({
          date: "",
          wordCount: 0,
          exists: false,
          filePath: "",
        });
      }
      weeks.push(emptyWeek);
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

  private async showWeeklyContextMenu(
    evt: MouseEvent,
    year: number,
    week: number
  ): Promise<void> {
    const weeklyFolder = this.plugin.settings.weeklyFolder
      ? normalizePath(this.plugin.settings.weeklyFolder)
      : "";
    const config = await this.getConfig();
    const diaryFolder = getFolderPath(config);
    const folder = weeklyFolder || diaryFolder;
    const fileName = `${year}-第${week}周.md`;
    const filePath = folder
      ? normalizePath(`${folder}/${fileName}`)
      : fileName;

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setTitle("打开周记")
          .setIcon("file-text")
          .onClick(() => this.openDiary(filePath))
      );
      menu.addItem((item) =>
        item
          .setTitle("复制路径")
          .setIcon("copy")
          .onClick(() => {
            navigator.clipboard.writeText(filePath);
            new Notice("路径已复制到剪贴板");
          })
      );
      menu.addSeparator();
      menu.addItem((item) =>
        item
          .setTitle("删除周记")
          .setIcon("trash")
          .onClick(async () => {
            await this.app.fileManager.trashFile(file);
            this.debouncedRefresh();
            new Notice("周记已移至回收站");
          })
      );
      menu.showAtMouseEvent(evt);
    } else {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setTitle("创建周记")
          .setIcon("plus")
          .onClick(() => this.openOrCreateWeeklyDiary(year, week))
      );
      menu.showAtMouseEvent(evt);
    }
  }

  private highlightActiveDiary(): void {
    const activeFile = this.app.workspace.getActiveFile();

    // 移除日记高亮
    const prevCell = this.contentArea.querySelector(".diary-heatmap-calendar-cell.is-active");
    if (prevCell) prevCell.classList.remove("is-active");

    // 移除周记高亮
    const prevWeek = this.contentArea.querySelector(
      ".diary-heatmap-calendar-week-label.is-active-week"
    );
    if (prevWeek) prevWeek.classList.remove("is-active-week");

    if (!activeFile) return;

    // 日记高亮
    const cell = this.contentArea.querySelector(
      `.diary-heatmap-calendar-cell[data-file-path="${activeFile.path}"]`
    );
    if (cell) {
      cell.classList.add("is-active");
      return;
    }

    // 周记高亮：文件名匹配 {year}-第{week}周.md
    const weeklyMatch = activeFile.name.match(/^(\d{4})-第(\d{1,2})周\.md$/);
    if (weeklyMatch) {
      const year = parseInt(weeklyMatch[1]);
      const week = parseInt(weeklyMatch[2]);
      if (year === this.calendarDate.year()) {
        const weekLabel = this.contentArea.querySelector(
          `.diary-heatmap-calendar-week-label[data-week-num="${week}"]`
        );
        if (weekLabel) {
          weekLabel.classList.add("is-active-week");
        }
      }
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
            .replace(/\{\{time\}\}/g, date.format("HH:mm"))
            .replace(/\{\{date:([^}]+)\}\}/g, (_, fmt: string) => date.format(fmt))
            .replace(/\{\{time:([^}]+)\}\}/g, (_, fmt: string) => date.format(fmt))
            .replace(/\{\{yesterday\}\}/g, date.clone().subtract(1, "day").format("YYYY年M月D日"))
            .replace(/\{\{tomorrow\}\}/g, date.clone().add(1, "day").format("YYYY年M月D日"));

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
    const weeklyFolder = this.plugin.settings.weeklyFolder
      ? normalizePath(this.plugin.settings.weeklyFolder)
      : "";
    const config = await this.getConfig();
    const diaryFolder = getFolderPath(config);
    const folder = weeklyFolder || diaryFolder;
    const fileName = `${year}-第${week}周.md`;
    const filePath = folder
      ? normalizePath(`${folder}/${fileName}`)
      : fileName;

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
      return;
    }

    // 二次确认弹窗
    new ConfirmModal(
      this.app,
      `是否创建 ${year}年第${week}周的周记？`,
      async () => {
        try {
          const content = "";
          if (folder && !(await this.app.vault.adapter.exists(folder))) {
            await this.app.vault.createFolder(folder);
          }
          const newFile = await this.app.vault.create(filePath, content);
          this.app.workspace.getLeaf().openFile(newFile);
          new Notice(`已创建周记: ${year}年第${week}周`);
        } catch (e) {
          console.error(`[Diary Heatmap] Failed to create weekly note:`, e);
          new Notice("创建周记失败");
        }
      }
    ).open();
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
