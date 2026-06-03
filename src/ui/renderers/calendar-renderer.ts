import { DiaryService } from "../../services/diary-service";
import { HeatmapDayData, getHeatLevel } from "../../utils/heatmap-data";


export class CalendarRenderer {
  constructor(private diaryService: DiaryService) {}

  render(
    container: HTMLElement,
    data: HeatmapDayData[],
    calendarDate: moment.Moment,
    showWeekNumbers: boolean,
    weeklyExistsInMonth: Set<number>,
    weeklyWordCounts: Map<number, number>,
    thresholds: number[],
    weekStart: number
  ): void {
    container.empty();

    const wrapper = container.createDiv("diary-heatmap-calendar-wrapper");
    const allWeekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekDays = [
      ...allWeekDays.slice(weekStart),
      ...allWeekDays.slice(0, weekStart),
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
        const isCurrentMonth =
          date.month() === calendarDate.month() &&
          date.year() === calendarDate.year();
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
            `${date.format("MMM D, dddd")}: ${dayData.wordCount}字`
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

        // 右键菜单（仅对有日记的日期）
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

    // 本月统计栏
    const stats = data.reduce(
      (acc, d) => {
        if (!d.date) return acc;
        const date = window.moment(d.date);
        if (
          date.month() === calendarDate.month() &&
          date.year() === calendarDate.year()
        ) {
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
      emptyTip.setText("本月暂无日记，点击任意日期开始记录");
    }

    const calendarFooter = wrapper.createDiv(
      "diary-heatmap-calendar-footer"
    );
    calendarFooter.createSpan({
      cls: "diary-heatmap-calendar-footer-text",
      text: `本月日记 ${stats.diaryDays} 篇 · 共计 ${stats.totalWords} 字`,
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
  private getWeeklyDots(wordCount: number, thresholds: number[]): boolean[] {
    const dots: boolean[] = [];
    for (const t of thresholds) {
      if (wordCount >= t) {
        dots.push(true); // 实心
      } else {
        dots.push(false); // 空心（虚线边框）
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
}
