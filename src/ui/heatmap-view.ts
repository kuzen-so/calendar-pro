import {
  ItemView,
  WorkspaceLeaf,
  TFile,
  Notice,
  normalizePath,
  setIcon,
} from "obsidian";
import DiaryHeatmapPlugin from "../main";
import { DiaryService } from "../services/diary-service";
import { HeatmapRenderer } from "./renderers/heatmap-renderer";
import { CalendarRenderer } from "./renderers/calendar-renderer";
import {
  HeatmapDayData,
  DataCache,
  getYearHeatmapData,
  getRecentYearHeatmapData,
  getMonthHeatmapData,
  countWords,
} from "../utils/heatmap-data";
import {
  DailyNotesConfig,
  getFolderPath,
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
  private diaryService: DiaryService;
  private heatmapRenderer: HeatmapRenderer;
  private calendarRenderer: CalendarRenderer;
  private keydownHandler: ((evt: KeyboardEvent) => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: DiaryHeatmapPlugin) {
    super(leaf);
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
    if (this.viewMode === "calendar") {
      await this.loadWeeklyExists();
    }
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

    // 键盘导航支持
    this.containerElRef.setAttribute("tabindex", "0");
    this.keydownHandler = (evt: KeyboardEvent) => {
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
    if (this.keydownHandler && this.containerElRef) {
      this.containerElRef.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
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

      // 周记文件名可能因跨年而不一致：优先用视图年份，再尝试周实际所属年份
      const candidates = [
        `${this.calendarDate.year()}-第${weekNum}周.md`,
      ];
      const weekYear = date.weekYear();
      if (weekYear !== this.calendarDate.year()) {
        candidates.push(`${weekYear}-第${weekNum}周.md`);
      }

      for (const fileName of candidates) {
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
          break;
        }
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
    });
    setIcon(this.calendarTab, "calendar");
    this.heatmapTab = tabContainer.createDiv({
      cls: `diary-heatmap-tab ${this.viewMode === "heatmap" ? "active" : ""}`,
    });
    setIcon(this.heatmapTab, "layout-grid");

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
  private renderHeatmapLayout(): void {
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
      const week = parseInt(weeklyMatch[2]);
      const weekLabel = this.contentArea.querySelector(
        `.diary-heatmap-calendar-week-label[data-week-num="${week}"]`
      );
      if (weekLabel) {
        weekLabel.classList.add("is-active-week");
      }
    }
  }

}

