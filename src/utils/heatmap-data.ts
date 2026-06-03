import { App, TFile } from "obsidian";
import { DailyNotesConfig, getDiaryFilePath } from "./daily-notes-config";

export interface HeatmapDayData {
  date: string;
  wordCount: number;
  exists: boolean;
  filePath: string;
  inYear?: boolean;
}

/**
 * 统计字数：中文字符 + 英文单词
 * 优化：先检查是否有 frontmatter，避免无意义的全局替换
 */
export function countWords(content: string): number {
  let text = content;
  if (text.startsWith("---")) {
    const end = text.indexOf("---", 3);
    if (end !== -1) {
      text = text.slice(end + 3).trimStart();
    }
  }
  const cleanText = text
    .replace(/[#*\-\[\]\(\)!|`>_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const chineseChars = (cleanText.match(/[一-鿿]/g) || []).length;
  const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

/**
 * 根据字数获取热力等级
 */
export function getHeatLevel(wordCount: number, thresholds: number[]): number {
  if (wordCount === 0) return 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (wordCount <= thresholds[i]) return i + 1;
  }
  return thresholds.length + 1;
}

/**
 * 文件缓存项
 */
interface CacheEntry {
  wordCount: number;
  mtime: number;
}

/**
 * 数据缓存管理器
 * 基于 Vault 中实际文件的状态进行缓存，避免重复 IO
 */
export class DataCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private app: App) {}

  /**
   * 使指定路径的缓存失效
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取任意文件的字数数据（带缓存）
   */
  async getFileData(filePath: string): Promise<{ wordCount: number; exists: boolean }> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
      this.cache.delete(filePath);
      return { wordCount: 0, exists: false };
    }

    const cached = this.cache.get(filePath);
    if (cached && cached.mtime === file.stat.mtime) {
      return { wordCount: cached.wordCount, exists: true };
    }

    try {
      const content = await this.app.vault.read(file);
      const wordCount = countWords(content);
      this.cache.set(filePath, { wordCount, mtime: file.stat.mtime });
      return { wordCount, exists: true };
    } catch (e) {
      console.error(`[Diary Heatmap] Failed to read ${filePath}:`, e);
      this.cache.delete(filePath);
      return { wordCount: 0, exists: true };
    }
  }

  /**
   * 获取指定日期的日记数据（带缓存）
   */
  async getDayData(date: moment.Moment, config: DailyNotesConfig): Promise<{
    wordCount: number;
    exists: boolean;
    filePath: string;
  }> {
    const filePath = getDiaryFilePath(date, config);
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (!(file instanceof TFile)) {
      // 文件不存在，检查缓存中是否还有旧记录（可能刚被删除）
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
  async getRangeData(
    config: DailyNotesConfig,
    start: moment.Moment,
    end: moment.Moment,
    yearFilter?: number
  ): Promise<HeatmapDayData[]> {
    const dates: { date: moment.Moment; dateStr: string; inYear: boolean }[] = [];
    const current = start.clone();

    while (current.isSameOrBefore(end, "day")) {
      const dateStr = current.format("YYYY-MM-DD");
      const inYear = yearFilter !== undefined ? current.year() === yearFilter : true;
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
}

/**
 * 根据自定义周开始日计算周的边界
 */
function getWeekBoundary(
  date: moment.Moment,
  weekStart: number,
  isEnd: boolean
): moment.Moment {
  const day = date.day(); // 0=周日, 1=周一, ...
  const diff = (day - weekStart + 7) % 7;
  const start = date.clone().subtract(diff, "days");
  if (isEnd) {
    return start.add(6, "days");
  }
  return start;
}

/**
 * 获取指定年份的完整热力图数据
 */
export async function getYearHeatmapData(
  cache: DataCache,
  config: DailyNotesConfig,
  year: number,
  weekStart = 1
): Promise<HeatmapDayData[]> {
  const startOfYear = window.moment(`${year}-01-01`, "YYYY-MM-DD");
  const endOfYear = window.moment(`${year}-12-31`, "YYYY-MM-DD");
  const start = getWeekBoundary(startOfYear, weekStart, false);
  const end = getWeekBoundary(endOfYear, weekStart, true);
  return cache.getRangeData(config, start, end, year);
}

/**
 * 获取近一年的热力图数据
 */
export async function getRecentYearHeatmapData(
  cache: DataCache,
  config: DailyNotesConfig,
  weekStart = 1
): Promise<HeatmapDayData[]> {
  const endDate = window.moment();
  const startDate = endDate.clone().subtract(1, "year").add(1, "day");
  const start = getWeekBoundary(startDate, weekStart, false);
  const end = getWeekBoundary(endDate, weekStart, true);
  return cache.getRangeData(config, start, end);
}

/**
 * 获取指定月份的热力图数据
 * 始终覆盖 6 周（42 天），确保日历固定显示 6 行
 */
export async function getMonthHeatmapData(
  cache: DataCache,
  config: DailyNotesConfig,
  year: number,
  month: number,
  weekStart = 1
): Promise<HeatmapDayData[]> {
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
