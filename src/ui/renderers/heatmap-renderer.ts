import { App, TFile, TFolder } from "obsidian";
import { DiaryService } from "../../services/diary-service";
import { HeatmapDayData, getHeatLevel } from "../../utils/heatmap-data";

export class HeatmapRenderer {
  constructor(
    private app: App,
    private diaryService: DiaryService
  ) {}

  render(
    container: HTMLElement,
    footer: HTMLElement,
    data: HeatmapDayData[],
    year: number,
    thresholds: number[],
    colors: string[],
    darkColors: string[],
    weeklyFolder: string,
    containerWidth: number
  ): void {
    const isDark = document.body.classList.contains("theme-dark");
    const activeColors = isDark ? darkColors : colors;
    container.empty();
    footer.empty();

    const wrapper = container.createDiv("diary-heatmap-grid-wrapper");

    // 上方：根据年份动态显示时间提示
    const now = window.moment();
    let topStatsText = "";
    if (year === now.year()) {
      const endOfYear = window.moment(`${year}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
      const remainingMonths = Math.max(0, endOfYear.diff(now, "months"));
      const remainingDays = Math.max(0, endOfYear.diff(now, "days"));
      const remainingHours = Math.max(0, endOfYear.diff(now, "hours"));
      topStatsText = `本年度剩余 ${remainingMonths} 月 · ${remainingDays} 天 · ${remainingHours} 小时`;
    } else if (year < now.year()) {
      const endOfYear = window.moment(`${year}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss");
      const passedDays = Math.max(0, now.diff(endOfYear, "days"));
      topStatsText = `距离 ${year} 年已过去 ${passedDays} 天`;
    } else {
      const startOfYear = window.moment(`${year}-01-01 00:00:00`, "YYYY-MM-DD HH:mm:ss");
      const remainingDays = Math.max(0, startOfYear.diff(now, "days"));
      topStatsText = `距离 ${year} 年还有 ${remainingDays} 天`;
    }

    const topStats = wrapper.createDiv("diary-heatmap-top-stats");
    topStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: topStatsText,
    });

    const grid = wrapper.createDiv("diary-heatmap-grid");

    // 根据容器宽度计算列数
    const cellTotal = 14; // 12px(cell) + 2px(gap)
    const maxCols = Math.max(1, Math.floor(containerWidth / cellTotal));
    const totalCells = data.length;

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

    // 补齐最后一行使网格完整
    const totalGridCells = cols * rows;
    for (let i = data.length; i < totalGridCells; i++) {
      const cell = document.createElement("div");
      cell.className = "diary-heatmap-cell empty-cell";
      fragment.appendChild(cell);
    }

    grid.appendChild(fragment);

    // 下方：本年度日记与周记统计
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
      emptyTip.setText("暂无日记，点击任意日期开始记录");
    }

    const bottomStats = wrapper.createDiv("diary-heatmap-bottom-stats");
    bottomStats.createSpan({
      cls: "diary-heatmap-stats-text",
      text: `本年度共写 ${yearStats.diaryCount} 篇日记 • ${weeklyCount} 篇周记 • 共计 ${yearStats.totalWords} 字`,
    });

    // 图例
    const legendRow = wrapper.createDiv("diary-heatmap-legend-row");
    legendRow.createSpan({ cls: "diary-heatmap-legend-label", text: "少" });
    const legendCells = legendRow.createDiv("diary-heatmap-legend-cells");
    for (let i = 1; i <= 6; i++) {
      const cell = legendCells.createDiv("diary-heatmap-cell legend-cell");
      if (activeColors[i - 1]) {
        cell.style.backgroundColor = activeColors[i - 1];
      }
    }
    legendRow.createSpan({ cls: "diary-heatmap-legend-label", text: "多" });

    footer.appendChild(wrapper);
  }

  private countWeeklyNotes(year: number, weeklyFolder: string): number {
    const prefix = `${year}-第`;
    const suffix = "周.md";

    if (weeklyFolder) {
      const folder = this.app.vault.getAbstractFileByPath(weeklyFolder);
      if (folder instanceof TFolder) {
        let count = 0;
        for (const child of folder.children) {
          if (child instanceof TFile && child.extension === "md") {
            const name = child.name;
            if (name.startsWith(prefix) && name.endsWith(suffix)) {
              count++;
            }
          }
        }
        return count;
      }
    }

    // 未设置周记文件夹时回退到全库扫描
    const weeklyPattern = new RegExp(`^${year}-第\\d{1,2}周\\.md$`);
    return this.app.vault.getFiles().filter((f) =>
      weeklyPattern.test(f.name)
    ).length;
  }
}
